#include "sphere_daux_vst3_processor.h"

#include <cstdio>
#include <cmath>
#include <memory>
#include <string>

#include "pluginterfaces/base/ipluginbase.h"
#include "pluginterfaces/vst/ivstaudioprocessor.h"
#include "pluginterfaces/vst/ivstcomponent.h"
#include "pluginterfaces/vst/ivsteditcontroller.h"
#include "pluginterfaces/vst/ivstprocesscontext.h"
#include "public.sdk/source/vst/hosting/hostclasses.h"
#include "public.sdk/source/vst/hosting/module.h"
#include "public.sdk/source/vst/utility/uid.h"

namespace {

constexpr const char* kVst3AudioModuleClass = "Audio Module Class";

bool looks_like_zero_class_id(const std::string& value) {
  if (value.empty()) return true;
  for (char c : value) {
    if (c != '0' && c != '-' && c != '{' && c != '}') return false;
  }
  return true;
}

VST3::Optional<VST3::UID> first_audio_module_uid(const VST3::Hosting::PluginFactory& factory) {
  for (const auto& info : factory.classInfos()) {
    if (info.category() != kVst3AudioModuleClass) continue;
    return VST3::Optional<VST3::UID>(info.ID());
  }
  return {};
}

} // namespace

struct SphereDauxVst3Processor {
  VST3::Hosting::Module::Ptr module;
  Steinberg::Vst::HostApplication host_context;
  Steinberg::IPtr<Steinberg::Vst::IComponent> component;
  Steinberg::IPtr<Steinberg::Vst::IAudioProcessor> processor;
  Steinberg::IPtr<Steinberg::Vst::IEditController> controller;
  Steinberg::IPtr<Steinberg::Vst::IConnectionPoint> component_connection;
  Steinberg::IPtr<Steinberg::Vst::IConnectionPoint> controller_connection;
  bool controller_is_component = false;
  Steinberg::Vst::SpeakerArrangement input_arrangement = Steinberg::Vst::SpeakerArr::kStereo;
  Steinberg::Vst::SpeakerArrangement output_arrangement = Steinberg::Vst::SpeakerArr::kStereo;
  float input_l = 0.0f;
  float input_r = 0.0f;
  float output_l = 0.0f;
  float output_r = 0.0f;
  float* input_channels[2] = {&input_l, &input_r};
  float* output_channels[2] = {&output_l, &output_r};
  Steinberg::Vst::AudioBusBuffers input_bus{};
  Steinberg::Vst::AudioBusBuffers output_bus{};
  Steinberg::Vst::ProcessContext process_context{};
  Steinberg::Vst::ProcessData process_data{};
  bool processing = false;
  unsigned long long process_count = 0;
  double last_input_peak = 0.0;
  double last_output_peak = 0.0;
  double last_difference_peak = 0.0;

  bool setup(double sample_rate) {
    input_bus.numChannels = 2;
    input_bus.channelBuffers32 = input_channels;
    output_bus.numChannels = 2;
    output_bus.channelBuffers32 = output_channels;

    process_data.processMode = Steinberg::Vst::kRealtime;
    process_data.symbolicSampleSize = Steinberg::Vst::kSample32;
    process_data.numSamples = 1;
    process_data.numInputs = 1;
    process_data.numOutputs = 1;
    process_data.inputs = &input_bus;
    process_data.outputs = &output_bus;
    process_context.sampleRate = sample_rate > 0.0 ? sample_rate : 44100.0;
    process_context.tempo = 120.0;
    process_context.timeSigNumerator = 4;
    process_context.timeSigDenominator = 4;
    process_context.state =
        Steinberg::Vst::ProcessContext::kTempoValid |
        Steinberg::Vst::ProcessContext::kTimeSigValid |
        Steinberg::Vst::ProcessContext::kPlaying;
    process_data.processContext = &process_context;

    if (component->activateBus(Steinberg::Vst::kAudio, Steinberg::Vst::kInput, 0, true) != Steinberg::kResultOk) {
      std::fprintf(stderr, "[DAUx VST3] activate input bus failed\n");
    }
    if (component->activateBus(Steinberg::Vst::kAudio, Steinberg::Vst::kOutput, 0, true) != Steinberg::kResultOk) {
      std::fprintf(stderr, "[DAUx VST3] activate output bus failed\n");
    }
    processor->setBusArrangements(&input_arrangement, 1, &output_arrangement, 1);

    Steinberg::Vst::ProcessSetup process_setup{};
    process_setup.processMode = Steinberg::Vst::kRealtime;
    process_setup.symbolicSampleSize = Steinberg::Vst::kSample32;
    process_setup.maxSamplesPerBlock = 1;
    process_setup.sampleRate = sample_rate > 0.0 ? sample_rate : 44100.0;
    if (processor->setupProcessing(process_setup) != Steinberg::kResultOk) {
      std::fprintf(stderr, "[DAUx VST3] setupProcessing failed\n");
      return false;
    }
    if (component->setActive(true) != Steinberg::kResultOk) {
      std::fprintf(stderr, "[DAUx VST3] setActive(true) failed\n");
      return false;
    }
    if (processor->setProcessing(true) != Steinberg::kResultOk) {
      std::fprintf(stderr, "[DAUx VST3] setProcessing(true) failed\n");
      return false;
    }
    processing = true;
    return true;
  }

  void shutdown() {
    if (processor && processing) processor->setProcessing(false);
    processing = false;
    if (component_connection && controller_connection) {
      component_connection->disconnect(controller_connection);
      controller_connection->disconnect(component_connection);
    }
    component_connection = nullptr;
    controller_connection = nullptr;
    if (controller && !controller_is_component) {
      if (auto plug_base = Steinberg::FUnknownPtr<Steinberg::IPluginBase>(controller)) {
        plug_base->terminate();
      }
    }
    if (component) {
      component->setActive(false);
      if (auto plug_base = Steinberg::FUnknownPtr<Steinberg::IPluginBase>(component)) {
        plug_base->terminate();
      }
    }
  }
};

extern "C" SphereDauxVst3Processor* sphere_daux_vst3_create(
    const char* plugin_path,
    const char* class_id,
    double sample_rate) {
  if (!plugin_path || !*plugin_path) return nullptr;

  auto instance = std::make_unique<SphereDauxVst3Processor>();
  std::string error;
  instance->module = VST3::Hosting::Module::create(plugin_path, error);
  if (!instance->module) {
    std::fprintf(stderr, "[DAUx VST3] module load failed: %s\n", error.c_str());
    return nullptr;
  }

  const auto factory = instance->module->getFactory();
  factory.setHostContext(&instance->host_context);

  const std::string requested_class_id = class_id ? class_id : "";
  VST3::Optional<VST3::UID> uid;
  if (!looks_like_zero_class_id(requested_class_id)) {
    uid = VST3::UID::fromString(requested_class_id);
  }
  if (!uid) uid = first_audio_module_uid(factory);
  if (!uid) {
    std::fprintf(stderr, "[DAUx VST3] no Audio Module Class found\n");
    return nullptr;
  }

  instance->component = factory.createInstance<Steinberg::Vst::IComponent>(*uid);
  if (!instance->component) {
    std::fprintf(stderr, "[DAUx VST3] create IComponent failed\n");
    return nullptr;
  }
  if (auto plug_base = Steinberg::FUnknownPtr<Steinberg::IPluginBase>(instance->component)) {
    if (plug_base->initialize(&instance->host_context) != Steinberg::kResultOk) {
      std::fprintf(stderr, "[DAUx VST3] component initialize failed\n");
      return nullptr;
    }
  } else {
    std::fprintf(stderr, "[DAUx VST3] component does not implement IPluginBase\n");
    return nullptr;
  }

  if (instance->component->queryInterface(
          Steinberg::Vst::IAudioProcessor::iid,
          reinterpret_cast<void**>(&instance->processor)) != Steinberg::kResultTrue ||
      !instance->processor) {
    std::fprintf(stderr, "[DAUx VST3] component does not implement IAudioProcessor\n");
    return nullptr;
  }

  Steinberg::Vst::IEditController* raw_controller = nullptr;
  if (instance->component->queryInterface(
          Steinberg::Vst::IEditController::iid,
          reinterpret_cast<void**>(&raw_controller)) == Steinberg::kResultTrue) {
    instance->controller =
        Steinberg::IPtr<Steinberg::Vst::IEditController>::adopt(raw_controller);
    instance->controller_is_component = true;
  } else {
    Steinberg::TUID controller_cid{};
    if (instance->component->getControllerClassId(controller_cid) == Steinberg::kResultTrue) {
      instance->controller =
          factory.createInstance<Steinberg::Vst::IEditController>(VST3::UID(controller_cid));
      if (instance->controller) {
        if (auto controller_base =
                Steinberg::FUnknownPtr<Steinberg::IPluginBase>(instance->controller)) {
          if (controller_base->initialize(&instance->host_context) != Steinberg::kResultOk) {
            std::fprintf(stderr, "[DAUx VST3] controller initialize failed\n");
            instance->controller = nullptr;
          }
        }
      }
    }
  }

  if (instance->controller) {
    instance->component_connection =
        Steinberg::FUnknownPtr<Steinberg::Vst::IConnectionPoint>(instance->component);
    instance->controller_connection =
        Steinberg::FUnknownPtr<Steinberg::Vst::IConnectionPoint>(instance->controller);
    if (instance->component_connection && instance->controller_connection) {
      instance->component_connection->connect(instance->controller_connection);
      instance->controller_connection->connect(instance->component_connection);
      std::fprintf(stderr, "[DAUx VST3] component/controller connected\n");
    }
  }

  if (!instance->setup(sample_rate)) {
    instance->shutdown();
    return nullptr;
  }

  std::fprintf(stderr, "[DAUx VST3] processor ready: %s\n", plugin_path);
  return instance.release();
}

extern "C" void sphere_daux_vst3_destroy(SphereDauxVst3Processor* processor) {
  if (!processor) return;
  processor->shutdown();
  delete processor;
}

extern "C" int sphere_daux_vst3_process_stereo_sample(
    SphereDauxVst3Processor* processor,
    float in_l,
    float in_r,
    float* out_l,
    float* out_r) {
  if (!processor || !processor->processor || !out_l || !out_r) return 0;
  processor->input_l = in_l;
  processor->input_r = in_r;
  processor->output_l = 0.0f;
  processor->output_r = 0.0f;
  const auto result = processor->processor->process(processor->process_data);
  if (result != Steinberg::kResultOk) return 0;
  processor->process_count += 1;
  processor->last_input_peak = (std::max)(std::abs(static_cast<double>(in_l)), std::abs(static_cast<double>(in_r)));
  processor->last_output_peak = (std::max)(std::abs(static_cast<double>(processor->output_l)), std::abs(static_cast<double>(processor->output_r)));
  processor->last_difference_peak = (std::max)(
      std::abs(static_cast<double>(processor->output_l - in_l)),
      std::abs(static_cast<double>(processor->output_r - in_r)));
  *out_l = processor->output_l;
  *out_r = processor->output_r;
  return 1;
}

extern "C" unsigned long long sphere_daux_vst3_process_count(SphereDauxVst3Processor* processor) {
  return processor ? processor->process_count : 0;
}

extern "C" double sphere_daux_vst3_last_input_peak(SphereDauxVst3Processor* processor) {
  return processor ? processor->last_input_peak : 0.0;
}

extern "C" double sphere_daux_vst3_last_output_peak(SphereDauxVst3Processor* processor) {
  return processor ? processor->last_output_peak : 0.0;
}

extern "C" double sphere_daux_vst3_last_difference_peak(SphereDauxVst3Processor* processor) {
  return processor ? processor->last_difference_peak : 0.0;
}

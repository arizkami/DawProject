#pragma once

#ifdef _WIN32
#  define SPHERE_DAUX_VST3_API __declspec(dllexport)
#else
#  define SPHERE_DAUX_VST3_API __attribute__((visibility("default")))
#endif

extern "C" {

struct SphereDauxVst3Processor;

SPHERE_DAUX_VST3_API SphereDauxVst3Processor* sphere_daux_vst3_create(
    const char* plugin_path,
    const char* class_id,
    double sample_rate);

SPHERE_DAUX_VST3_API void sphere_daux_vst3_destroy(SphereDauxVst3Processor* processor);

SPHERE_DAUX_VST3_API int sphere_daux_vst3_process_stereo_sample(
    SphereDauxVst3Processor* processor,
    float in_l,
    float in_r,
    float* out_l,
    float* out_r);

SPHERE_DAUX_VST3_API unsigned long long sphere_daux_vst3_process_count(
    SphereDauxVst3Processor* processor);

SPHERE_DAUX_VST3_API double sphere_daux_vst3_last_input_peak(
    SphereDauxVst3Processor* processor);

SPHERE_DAUX_VST3_API double sphere_daux_vst3_last_output_peak(
    SphereDauxVst3Processor* processor);

SPHERE_DAUX_VST3_API double sphere_daux_vst3_last_difference_peak(
    SphereDauxVst3Processor* processor);

}

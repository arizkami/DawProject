// Required by napi-build to generate platform-specific .def / linker files
// for the native Node.js addon (.node output).
extern crate napi_build;

fn main() {
    let manifest_dir = std::path::PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap());
    let sdk_root = manifest_dir.join("../../external/vst3sdk");
    let bridge_root = manifest_dir.join("vst3bridge");

    println!(
        "cargo:rerun-if-changed={}",
        bridge_root
            .join("include/sphere_daux_vst3_processor.h")
            .display()
    );
    println!(
        "cargo:rerun-if-changed={}",
        bridge_root.join("src/vst3_processor.cpp").display()
    );

    let mut build = cc::Build::new();
    build
        .cpp(true)
        .std("c++20")
        .flag_if_supported("/Zc:char8_t-")
        .flag_if_supported("/EHsc")
        .include(bridge_root.join("include"))
        .include(&sdk_root)
        .include(sdk_root.join("pluginterfaces"))
        .include(sdk_root.join("public.sdk/source"))
        .file(bridge_root.join("src/vst3_processor.cpp"))
        .file(sdk_root.join("pluginterfaces/base/coreiids.cpp"))
        .file(sdk_root.join("pluginterfaces/base/funknown.cpp"))
        .file(sdk_root.join("pluginterfaces/base/ustring.cpp"))
        .file(sdk_root.join("public.sdk/source/common/commonstringconvert.cpp"))
        .file(sdk_root.join("public.sdk/source/vst/utility/stringconvert.cpp"))
        .file(sdk_root.join("public.sdk/source/vst/vstinitiids.cpp"))
        .file(sdk_root.join("public.sdk/source/vst/hosting/hostclasses.cpp"))
        .file(sdk_root.join("public.sdk/source/vst/hosting/pluginterfacesupport.cpp"))
        .file(sdk_root.join("public.sdk/source/vst/hosting/module.cpp"));

    if cfg!(target_os = "windows") {
        build.define("SMTG_OS_WINDOWS", Some("1"));
        build.file(sdk_root.join("public.sdk/source/vst/hosting/module_win32.cpp"));
        println!("cargo:rustc-link-lib=ole32");
    } else if cfg!(target_os = "macos") {
        build.define("SMTG_OS_MACOS", Some("1"));
        build.file(sdk_root.join("public.sdk/source/vst/hosting/module_mac.mm"));
        println!("cargo:rustc-link-lib=framework=CoreFoundation");
        println!("cargo:rustc-link-lib=framework=Foundation");
    } else if cfg!(target_os = "linux") {
        build.define("SMTG_OS_LINUX", Some("1"));
        build.file(sdk_root.join("public.sdk/source/vst/hosting/module_linux.cpp"));
        println!("cargo:rustc-link-lib=dl");
    }

    build.compile("sphere_daux_vst3_processor");
    napi_build::setup();
}

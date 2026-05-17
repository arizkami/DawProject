// Required by napi-build to generate platform-specific .def / linker files
// for the native Node.js addon (.node output).
extern crate napi_build;

fn main() {
    napi_build::setup();
}

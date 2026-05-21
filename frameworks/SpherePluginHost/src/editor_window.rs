use std::ffi::CString;
use std::os::raw::{c_char, c_int, c_ulonglong};

use napi_derive::napi;

extern "C" {
    fn sphere_plugin_editor_open_window(
        window_id: *const c_char,
        title: *const c_char,
        subtitle: *const c_char,
        width: c_int,
        height: c_int,
    ) -> c_ulonglong;
    fn sphere_plugin_editor_close_window(handle: c_ulonglong);
}

#[napi(object)]
pub struct PluginEditorWindowOptions {
    pub window_id: String,
    pub title: String,
    pub subtitle: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
}

#[napi]
pub fn open_plugin_editor_window(options: PluginEditorWindowOptions) -> napi::Result<f64> {
    let window_id = CString::new(options.window_id)
        .map_err(|error| napi::Error::from_reason(error.to_string()))?;
    let title =
        CString::new(options.title).map_err(|error| napi::Error::from_reason(error.to_string()))?;
    let subtitle = CString::new(
        options
            .subtitle
            .unwrap_or_else(|| "Native plugin editor window".to_string()),
    )
    .map_err(|error| napi::Error::from_reason(error.to_string()))?;
    let handle = unsafe {
        sphere_plugin_editor_open_window(
            window_id.as_ptr(),
            title.as_ptr(),
            subtitle.as_ptr(),
            options.width.unwrap_or(560) as c_int,
            options.height.unwrap_or(380) as c_int,
        )
    };
    if handle == 0 {
        return Err(napi::Error::from_reason(
            "Plugin editor window failed to open",
        ));
    }
    Ok(handle as f64)
}

#[napi]
pub fn open_plugin_editor_for_path(plugin_path: String) -> napi::Result<f64> {
    let plugins = crate::scanner::scan_audio_plugin_paths(std::slice::from_ref(&plugin_path))
        .map_err(napi::Error::from_reason)?;
    let plugin = plugins.first();
    let title = plugin.map(|plugin| plugin.name.clone()).unwrap_or_else(|| {
        std::path::Path::new(&plugin_path)
            .file_stem()
            .and_then(|name| name.to_str())
            .unwrap_or("Plugin Editor")
            .to_string()
    });
    let subtitle = plugin
        .map(|plugin| format!("{} • {} • {}", plugin.format, plugin.vendor, plugin_path))
        .unwrap_or_else(|| format!("Native plugin editor • {plugin_path}"));
    open_plugin_editor_window(PluginEditorWindowOptions {
        window_id: format!("plugin-editor:{}", stable_id(&plugin_path)),
        title,
        subtitle: Some(subtitle),
        width: Some(820),
        height: Some(560),
    })
}

#[napi]
pub fn close_plugin_editor_window(handle: f64) -> napi::Result<()> {
    if handle <= 0.0 {
        return Ok(());
    }
    unsafe { sphere_plugin_editor_close_window(handle as c_ulonglong) };
    Ok(())
}

fn stable_id(input: &str) -> String {
    let mut hash: u64 = 0xcbf29ce484222325;
    for byte in input.as_bytes() {
        hash ^= u64::from(*byte);
        hash = hash.wrapping_mul(0x100000001b3);
    }
    format!("{hash:016x}")
}

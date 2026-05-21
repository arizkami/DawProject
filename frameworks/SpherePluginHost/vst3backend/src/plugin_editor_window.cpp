#include "sphere_plugin_host_vst3.h"

#include <atomic>
#include <cstdio>
#include <cstring>
#include <mutex>
#include <string>
#include <thread>
#include <unordered_map>

#ifdef _WIN32
#  define WIN32_LEAN_AND_MEAN
#  include <windows.h>
#endif

namespace {

std::atomic<unsigned long long> g_next_handle{1};
std::mutex g_windows_mutex;

#ifdef _WIN32
std::unordered_map<unsigned long long, HWND> g_windows;

std::wstring utf8_to_wide(const char* value) {
  if (!value || !*value) return L"";
  const int len = MultiByteToWideChar(CP_UTF8, 0, value, -1, nullptr, 0);
  if (len <= 0) return L"";
  std::wstring out(static_cast<std::size_t>(len - 1), L'\0');
  MultiByteToWideChar(CP_UTF8, 0, value, -1, out.data(), len);
  return out;
}

struct EditorWindowConfig {
  unsigned long long handle = 0;
  std::wstring title;
  std::wstring subtitle;
  int width = 520;
  int height = 360;
};

float dpi_scale(HWND hwnd) {
  const UINT dpi = hwnd ? GetDpiForWindow(hwnd) : GetDpiForSystem();
  return static_cast<float>(dpi ? dpi : 96) / 96.0f;
}

int sx(HWND hwnd, int value) {
  return static_cast<int>(static_cast<float>(value) * dpi_scale(hwnd));
}

HFONT make_ui_font(HWND hwnd, int logical_px, int weight) {
  return CreateFontW(
      sx(hwnd, logical_px), 0, 0, 0, weight, FALSE, FALSE, FALSE,
      DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
      CLEARTYPE_QUALITY, DEFAULT_PITCH, L"Segoe UI");
}

LRESULT CALLBACK editor_window_proc(HWND hwnd, UINT msg, WPARAM wparam, LPARAM lparam) {
  switch (msg) {
    case WM_NCCREATE: {
      auto* create = reinterpret_cast<CREATESTRUCTW*>(lparam);
      SetWindowLongPtrW(hwnd, GWLP_USERDATA, reinterpret_cast<LONG_PTR>(create->lpCreateParams));
      return DefWindowProcW(hwnd, msg, wparam, lparam);
    }
    case WM_CLOSE:
      DestroyWindow(hwnd);
      return 0;
    case WM_DESTROY: {
      const auto handle = static_cast<unsigned long long>(GetWindowLongPtrW(hwnd, GWLP_USERDATA));
      if (handle != 0) {
        std::lock_guard<std::mutex> lock(g_windows_mutex);
        g_windows.erase(handle);
      }
      PostQuitMessage(0);
      return 0;
    }
    case WM_PAINT: {
      PAINTSTRUCT ps{};
      HDC dc = BeginPaint(hwnd, &ps);
      RECT rc{};
      GetClientRect(hwnd, &rc);

      HBRUSH bg = CreateSolidBrush(RGB(14, 19, 25));
      FillRect(dc, &rc, bg);
      DeleteObject(bg);

      SetBkMode(dc, TRANSPARENT);
      SetTextColor(dc, RGB(231, 237, 245));
      HFONT title_font = make_ui_font(hwnd, 18, FW_SEMIBOLD);
      HFONT old_font = static_cast<HFONT>(SelectObject(dc, title_font));

      const auto* config = reinterpret_cast<EditorWindowConfig*>(GetWindowLongPtrW(hwnd, GWLP_USERDATA));
      std::wstring title = config ? config->title : L"Plugin Editor";
      std::wstring subtitle = config ? config->subtitle : L"Native plugin editor window";

      RECT title_rect{sx(hwnd, 24), sx(hwnd, 22), rc.right - sx(hwnd, 24), sx(hwnd, 52)};
      DrawTextW(dc, title.c_str(), -1, &title_rect, DT_SINGLELINE | DT_END_ELLIPSIS | DT_LEFT | DT_VCENTER);

      SelectObject(dc, old_font);
      DeleteObject(title_font);

      SetTextColor(dc, RGB(154, 166, 178));
      HFONT body_font = make_ui_font(hwnd, 13, FW_NORMAL);
      old_font = static_cast<HFONT>(SelectObject(dc, body_font));
      RECT sub_rect{sx(hwnd, 24), sx(hwnd, 54), rc.right - sx(hwnd, 24), sx(hwnd, 78)};
      DrawTextW(dc, subtitle.c_str(), -1, &sub_rect, DT_SINGLELINE | DT_END_ELLIPSIS | DT_LEFT | DT_VCENTER);

      HPEN border_pen = CreatePen(PS_SOLID, 1, RGB(45, 58, 68));
      HGDIOBJ old_pen = SelectObject(dc, border_pen);
      HBRUSH panel_brush = CreateSolidBrush(RGB(17, 24, 32));
      HGDIOBJ old_brush = SelectObject(dc, panel_brush);
      RoundRect(dc, sx(hwnd, 24), sx(hwnd, 96), rc.right - sx(hwnd, 24), rc.bottom - sx(hwnd, 24), sx(hwnd, 10), sx(hwnd, 10));
      SelectObject(dc, old_brush);
      SelectObject(dc, old_pen);
      DeleteObject(panel_brush);
      DeleteObject(border_pen);

      SetTextColor(dc, RGB(102, 113, 127));
      RECT body_rect{sx(hwnd, 40), sx(hwnd, 116), rc.right - sx(hwnd, 40), rc.bottom - sx(hwnd, 40)};
      const wchar_t* body = L"Native Plugin Editor shell\n\nWindows: Win32 window backend\nmacOS: NSWindow backend hook\nLinux: GTK4 backend hook\n\nExternal VST3/CLAP editor embedding will attach here.";
      DrawTextW(dc, body, -1, &body_rect, DT_LEFT | DT_TOP | DT_WORDBREAK);

      SelectObject(dc, old_font);
      DeleteObject(body_font);
      EndPaint(hwnd, &ps);
      return 0;
    }
    default:
      return DefWindowProcW(hwnd, msg, wparam, lparam);
  }
}

void run_win32_editor(EditorWindowConfig* config) {
  SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);
  const wchar_t* class_name = L"FutureboardPluginEditorWindow";
  WNDCLASSEXW wc{};
  wc.cbSize = sizeof(WNDCLASSEXW);
  wc.lpfnWndProc = editor_window_proc;
  wc.hInstance = GetModuleHandleW(nullptr);
  wc.hCursor = LoadCursor(nullptr, IDC_ARROW);
  wc.hbrBackground = reinterpret_cast<HBRUSH>(COLOR_WINDOW + 1);
  wc.lpszClassName = class_name;
  RegisterClassExW(&wc);

  const UINT dpi = GetDpiForSystem();
  const int scaled_width = MulDiv(config->width, dpi, 96);
  const int scaled_height = MulDiv(config->height, dpi, 96);
  RECT window_rect{0, 0, scaled_width, scaled_height};
  AdjustWindowRectExForDpi(&window_rect, WS_OVERLAPPEDWINDOW, FALSE, WS_EX_APPWINDOW, dpi);

  HWND hwnd = CreateWindowExW(
      WS_EX_APPWINDOW,
      class_name,
      config->title.c_str(),
      WS_OVERLAPPEDWINDOW,
      CW_USEDEFAULT,
      CW_USEDEFAULT,
      window_rect.right - window_rect.left,
      window_rect.bottom - window_rect.top,
      nullptr,
      nullptr,
      GetModuleHandleW(nullptr),
      reinterpret_cast<void*>(config));

  if (!hwnd) {
    delete config;
    return;
  }

  {
    std::lock_guard<std::mutex> lock(g_windows_mutex);
    g_windows[config->handle] = hwnd;
  }

  ShowWindow(hwnd, SW_SHOW);
  UpdateWindow(hwnd);

  MSG msg{};
  while (GetMessageW(&msg, nullptr, 0, 0) > 0) {
    TranslateMessage(&msg);
    DispatchMessageW(&msg);
  }

  delete config;
}
#endif

} // namespace

extern "C" unsigned long long sphere_plugin_editor_open_window(
    const char* window_id,
    const char* title,
    const char* subtitle,
    int width,
    int height) {
  (void)window_id;
  const auto handle = g_next_handle.fetch_add(1);
#ifdef _WIN32
  auto* config = new EditorWindowConfig();
  config->handle = handle;
  config->title = utf8_to_wide(title && *title ? title : "Plugin Editor");
  config->subtitle = utf8_to_wide(subtitle && *subtitle ? subtitle : "Native plugin editor window");
  config->width = width > 240 ? width : 520;
  config->height = height > 180 ? height : 360;
  std::thread(run_win32_editor, config).detach();
  return handle;
#elif defined(__APPLE__)
  std::fprintf(stderr, "[SpherePluginHost] NSWindow plugin editor backend is declared but not linked in this build. title=%s\n", title ? title : "");
  return handle;
#else
  std::fprintf(stderr, "[SpherePluginHost] GTK4 plugin editor backend is declared but not linked in this build. title=%s\n", title ? title : "");
  return handle;
#endif
}

extern "C" void sphere_plugin_editor_close_window(unsigned long long handle) {
#ifdef _WIN32
  HWND hwnd = nullptr;
  {
    std::lock_guard<std::mutex> lock(g_windows_mutex);
    auto it = g_windows.find(handle);
    if (it != g_windows.end()) hwnd = it->second;
  }
  if (hwnd) {
    PostMessageW(hwnd, WM_CLOSE, 0, 0);
  }
#else
  (void)handle;
#endif
}

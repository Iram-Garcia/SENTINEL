// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod telemetry_sim;
mod serial;

use serial::SerialPortState;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(SerialPortState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            telemetry_sim::mockdata,
            telemetry_sim::stream_telemetry,
            serial::list_ports,
            serial::open_port,
            serial::close_port,
            serial::monitor_port  // Add this line
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

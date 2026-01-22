fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![quit_app])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Custom commands for inter-process communication
#[tauri::command]
fn quit_app() {
    std::process::exit(0);
}

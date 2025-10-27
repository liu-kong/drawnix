mod recent_files;
mod commands;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      get_recent_files,
      add_to_recent_files,
      remove_recent_file,
      clear_recent_files,
      save_file_with_tracking,
      load_file_with_tracking
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

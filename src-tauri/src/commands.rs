use crate::recent_files::{add_recent_file, load_recent_files, RecentFile};
use tauri::{AppHandle, command};

#[command]
pub async fn get_recent_files(app_handle: AppHandle) -> Result<Vec<RecentFile>, String> {
    let data = load_recent_files(&app_handle)
        .await
        .map_err(|e| format!("Failed to load recent files: {}", e))?;
    
    Ok(data.get_files())
}

#[command]
pub async fn add_to_recent_files(
    app_handle: AppHandle,
    file_path: String,
    preview: Option<String>,
) -> Result<(), String> {
    add_recent_file(&app_handle, file_path, preview)
        .await
        .map_err(|e| format!("Failed to add recent file: {}", e))?;
    
    Ok(())
}

#[command]
pub async fn remove_recent_file(
    app_handle: AppHandle,
    file_path: String,
) -> Result<(), String> {
    let data = load_recent_files(&app_handle)
        .await
        .map_err(|e| format!("Failed to load recent files: {}", e))?;
    
    // Remove the file from recent files
    let files = data.get_files();
    let filtered_files: Vec<RecentFile> = files.into_iter().filter(|f| f.path != file_path).collect();
    
    // Create new data with updated files
    let mut new_data = crate::recent_files::RecentFilesData::default();
    for file in filtered_files {
        new_data.add_file(file);
    }
    
    crate::recent_files::save_recent_files(&app_handle, &new_data)
        .await
        .map_err(|e| format!("Failed to save recent files: {}", e))?;
    
    Ok(())
}

#[command]
pub async fn clear_recent_files(app_handle: AppHandle) -> Result<(), String> {
    let empty_data = crate::recent_files::RecentFilesData::default();
    
    crate::recent_files::save_recent_files(&app_handle, &empty_data)
        .await
        .map_err(|e| format!("Failed to clear recent files: {}", e))?;
    
    Ok(())
}

#[command]
pub async fn save_file_with_tracking(
    app_handle: AppHandle,
    content: String,
    file_path: String,
) -> Result<(), String> {
    use tokio::fs;
    
    // Save the file
    fs::write(&file_path, content)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    // Add to recent files
    add_recent_file(&app_handle, file_path, None)
        .await
        .map_err(|e| format!("Failed to add to recent files: {}", e))?;
    
    Ok(())
}

#[command]
pub async fn load_file_with_tracking(
    app_handle: AppHandle,
    file_path: String,
) -> Result<String, String> {
    use tokio::fs;
    
    // Read the file
    let content = fs::read_to_string(&file_path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    // Add to recent files
    add_recent_file(&app_handle, file_path, None)
        .await
        .map_err(|e| format!("Failed to add to recent files: {}", e))?;
    
    Ok(content)
}

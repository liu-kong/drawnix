use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};
use tokio::fs;

const MAX_RECENT_FILES: usize = 10;
const RECENT_FILES_FILENAME: &str = "recent_files.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentFile {
    pub name: String,
    pub path: String,
    pub last_modified: DateTime<Utc>,
    pub preview: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RecentFilesData {
    files: VecDeque<RecentFile>,
}

impl Default for RecentFilesData {
    fn default() -> Self {
        Self {
            files: VecDeque::new(),
        }
    }
}

impl RecentFilesData {
    pub fn add_file(&mut self, recent_file: RecentFile) {
        // Remove existing entry if path already exists
        self.files.retain(|f| f.path != recent_file.path);
        
        // Add to front
        self.files.push_front(recent_file);
        
        // Keep only MAX_RECENT_FILES
        if self.files.len() > MAX_RECENT_FILES {
            self.files.truncate(MAX_RECENT_FILES);
        }
    }
    
    pub fn get_files(&self) -> Vec<RecentFile> {
        self.files.iter().cloned().collect()
    }
    
    pub async fn cleanup_nonexistent_files(&mut self) {
        let mut valid_files = VecDeque::new();
        
        for file in &self.files {
            if Path::new(&file.path).exists() {
                valid_files.push_back(file.clone());
            }
        }
        
        self.files = valid_files;
    }
}

pub async fn get_recent_files_path(app_handle: &AppHandle) -> Result<PathBuf, Box<dyn std::error::Error>> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    // Ensure directory exists
    fs::create_dir_all(&app_data_dir).await?;
    
    Ok(app_data_dir.join(RECENT_FILES_FILENAME))
}

pub async fn load_recent_files(app_handle: &AppHandle) -> Result<RecentFilesData, Box<dyn std::error::Error>> {
    let recent_files_path = get_recent_files_path(app_handle).await?;
    
    if !recent_files_path.exists() {
        return Ok(RecentFilesData::default());
    }
    
    let content = fs::read_to_string(&recent_files_path).await?;
    let mut data: RecentFilesData = serde_json::from_str(&content)?;
    
    // Cleanup files that no longer exist
    data.cleanup_nonexistent_files().await;
    
    Ok(data)
}

pub async fn save_recent_files(
    app_handle: &AppHandle,
    data: &RecentFilesData,
) -> Result<(), Box<dyn std::error::Error>> {
    let recent_files_path = get_recent_files_path(app_handle).await?;
    let content = serde_json::to_string_pretty(data)?;
    fs::write(recent_files_path, content).await?;
    Ok(())
}

pub async fn add_recent_file(
    app_handle: &AppHandle,
    file_path: String,
    preview: Option<String>,
) -> Result<(), Box<dyn std::error::Error>> {
    let path = Path::new(&file_path);
    
    if !path.exists() {
        return Err(format!("File does not exist: {}", file_path).into());
    }
    
    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Unknown")
        .to_string();
    
    let metadata = fs::metadata(&file_path).await?;
    let last_modified = DateTime::from(metadata.modified()?);
    
    let recent_file = RecentFile {
        name,
        path: file_path,
        last_modified,
        preview,
    };
    
    let mut data = load_recent_files(app_handle).await?;
    data.add_file(recent_file);
    save_recent_files(app_handle, &data).await?;
    
    Ok(())
}

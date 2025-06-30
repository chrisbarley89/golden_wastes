#!/usr/bin/env python3
"""
Hugo Blog Testing Tool
A comprehensive tool for handling local testing tasks for Hugo blog projects.
"""

import sys
import os
import json
import subprocess
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List

from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QVBoxLayout, QHBoxLayout, QWidget,
    QLabel, QLineEdit, QPushButton, QTextEdit, QCheckBox, QComboBox,
    QFileDialog, QMessageBox, QScrollArea, QGroupBox, QGridLayout,
    QSizePolicy, QFrame, QSplitter
)
from PyQt5.QtCore import Qt, QThread, pyqtSignal, QTimer
from PyQt5.QtGui import QFont, QPalette, QColor, QTextCursor

# Configuration constants
STORAGE_FILE = "testing-ui.json"
THEME_FILES = ["theme.yaml", "theme.toml", "theme.md", "theme.html", "theme.gohtml", "theme.yml"]
SUPPORTED_FILE_TYPES = [".md", ".json"]
EXPORT_FORMATS = [".json", ".md", ".docx"]

class CommandThread(QThread):
    """Thread for running terminal commands without blocking UI"""
    output_ready = pyqtSignal(str, str)  # message, type (info/warning/error)
    finished_signal = pyqtSignal(bool, str)  # success, message
    
    def __init__(self, command: str, working_dir: str = None):
        super().__init__()
        self.command = command
        self.working_dir = working_dir
    
    def run(self):
        try:
            self.output_ready.emit(f"[{datetime.now().strftime('%H:%M:%S')}] Executing: {self.command}", "info")
            
            process = subprocess.Popen(
                self.command,
                shell=True,
                cwd=self.working_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                universal_newlines=True
            )
            
            stdout, stderr = process.communicate()
            
            if stdout:
                self.output_ready.emit(f"[{datetime.now().strftime('%H:%M:%S')}] Output: {stdout.strip()}", "info")
            
            if stderr:
                self.output_ready.emit(f"[{datetime.now().strftime('%H:%M:%S')}] Error: {stderr.strip()}", "error")
            
            success = process.returncode == 0
            message = "Command completed successfully" if success else f"Command failed with exit code {process.returncode}"
            self.finished_signal.emit(success, message)
            
        except Exception as e:
            self.output_ready.emit(f"[{datetime.now().strftime('%H:%M:%S')}] Exception: {str(e)}", "error")
            self.finished_signal.emit(False, f"Exception occurred: {str(e)}")

class FileManager:
    """Handles file operations and data persistence"""
    
    @staticmethod
    def load_config(project_dir: str) -> Dict[str, Any]:
        """Load configuration from storage file"""
        config_path = os.path.join(project_dir, "data", STORAGE_FILE)
        try:
            if os.path.exists(config_path):
                with open(config_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading config: {e}")
        return {}
    
    @staticmethod
    def save_config(project_dir: str, config: Dict[str, Any]) -> bool:
        """Save configuration to storage file"""
        try:
            data_dir = os.path.join(project_dir, "data")
            os.makedirs(data_dir, exist_ok=True)
            config_path = os.path.join(data_dir, STORAGE_FILE)
            
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Error saving config: {e}")
            return False
    
    @staticmethod
    def validate_theme_directory(theme_dir: str) -> bool:
        """Validate that theme directory contains required files"""
        if not os.path.isdir(theme_dir):
            return False
        
        for theme_file in THEME_FILES:
            if os.path.exists(os.path.join(theme_dir, theme_file)):
                return True
        return False
    
    @staticmethod
    def convert_file_to_json(file_path: str, output_path: str) -> bool:
        """Convert markdown or json file to moves.json format"""
        try:
            if file_path.endswith('.json'):
                shutil.copy2(file_path, output_path)
                return True
            elif file_path.endswith('.md'):
                # Basic markdown to JSON conversion - can be enhanced
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Simple conversion - you may want to enhance this
                json_content = {"content": content, "source": "markdown"}
                
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(json_content, f, indent=2, ensure_ascii=False)
                return True
        except Exception as e:
            print(f"Error converting file: {e}")
        return False

class CustomWidget:
    """Base class for custom UI components"""
    
    def __init__(self, parent, tooltip: str = ""):
        self.parent = parent
        self.tooltip = tooltip
    
    def apply_tooltip(self, widget):
        """Apply tooltip to widget"""
        if self.tooltip:
            widget.setToolTip(self.tooltip)

class DirectorySelector(CustomWidget):
    """Custom directory selector with text field and browse button"""
    
    def __init__(self, parent, default_dir: str = "", tooltip: str = ""):
        super().__init__(parent, tooltip)
        self.layout = QHBoxLayout()
        self.text_field = QLineEdit(default_dir)
        self.browse_button = QPushButton("Browse...")
        
        self.text_field.setPlaceholderText("Enter directory path...")
        self.browse_button.clicked.connect(self.browse_directory)
        
        self.layout.addWidget(self.text_field, 3)
        self.layout.addWidget(self.browse_button, 1)
        
        self.apply_tooltip(self.text_field)
        self.apply_tooltip(self.browse_button)
    
    def browse_directory(self):
        """Open directory selection dialog"""
        current_dir = self.text_field.text() or os.getcwd()
        directory = QFileDialog.getExistingDirectory(
            self.parent, "Select Directory", current_dir
        )
        if directory:
            self.text_field.setText(directory)
    
    def get_directory(self) -> str:
        """Get selected directory"""
        return self.text_field.text() or os.getcwd()
    
    def set_directory(self, directory: str):
        """Set directory"""
        self.text_field.setText(directory)

class FileSelector(CustomWidget):
    """Custom file selector with text field and browse button"""
    
    def __init__(self, parent, file_filter: str = "All Files (*)", tooltip: str = ""):
        super().__init__(parent, tooltip)
        self.file_filter = file_filter
        self.layout = QHBoxLayout()
        self.text_field = QLineEdit()
        self.browse_button = QPushButton("Browse...")
        
        self.text_field.setPlaceholderText("Enter file path...")
        self.browse_button.clicked.connect(self.browse_file)
        
        self.layout.addWidget(self.text_field, 3)
        self.layout.addWidget(self.browse_button, 1)
        
        self.apply_tooltip(self.text_field)
        self.apply_tooltip(self.browse_button)
    
    def browse_file(self):
        """Open file selection dialog"""
        current_dir = os.path.dirname(self.text_field.text()) or os.getcwd()
        file_path, _ = QFileDialog.getOpenFileName(
            self.parent, "Select File", current_dir, self.file_filter
        )
        if file_path:
            self.text_field.setText(file_path)
    
    def get_file(self) -> str:
        """Get selected file"""
        return self.text_field.text()
    
    def set_file(self, file_path: str):
        """Set file path"""
        self.text_field.setText(file_path)

class LoggingArea(QTextEdit):
    """Custom logging area with colored output"""
    
    def __init__(self):
        super().__init__()
        self.setReadOnly(True)
        self.setMinimumHeight(200)
        self.setFont(QFont("Consolas", 9))
        
    def log_message(self, message: str, msg_type: str = "info"):
        """Log message with appropriate color"""
        cursor = self.textCursor()
        cursor.movePosition(QTextCursor.End)
        
        color_map = {
            "info": "black",
            "warning": "orange", 
            "error": "red"
        }
        
        color = color_map.get(msg_type, "black")
        html_message = f'<span style="color: {color};">{message}</span><br>'
        
        cursor.insertHtml(html_message)
        self.setTextCursor(cursor)
        self.ensureCursorVisible()

class HugoBlogTestingTool(QMainWindow):
    """Main application window"""
    
    def __init__(self):
        super().__init__()
        self.config = {}
        self.generated_file_path = ""
        self.command_thread = None
        
        self.init_ui()
        self.load_settings()
        self.setup_auto_save()
    
    def init_ui(self):
        """Initialize the user interface"""
        self.setWindowTitle("Hugo Blog Testing Tool")
        self.setMinimumSize(900, 700)
        self.resize(1200, 800)
        
        # Main scroll area
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAsNeeded)
        scroll.setVerticalScrollBarPolicy(Qt.ScrollBarAsNeeded)
        
        main_widget = QWidget()
        main_layout = QVBoxLayout(main_widget)
        main_layout.setSpacing(10)
        
        # Create sections
        self.create_project_directory_section(main_layout)
        self.create_generate_content_section(main_layout)
        self.create_import_data_section(main_layout)
        self.create_export_data_section(main_layout)
        self.create_source_control_section(main_layout)
        self.create_hugo_run_section(main_layout)
        
        # Logging area
        log_group = QGroupBox("Debug Log")
        log_layout = QVBoxLayout(log_group)
        self.logging_area = LoggingArea()
        self.logging_area.setToolTip("Terminal output and application logs")
        log_layout.addWidget(self.logging_area)
        main_layout.addWidget(log_group)
        
        # Set scroll widget
        scroll.setWidget(main_widget)
        self.setCentralWidget(scroll)
        
        # Initial log message
        self.log("Application started", "info")
    
    def create_project_directory_section(self, parent_layout):
        """Create project directory selection section"""
        group = QGroupBox("Project Directory")
        layout = QVBoxLayout(group)
        
        self.project_dir_selector = DirectorySelector(
            self, os.getcwd(), 
            "Select the root directory of your Hugo blog project"
        )
        
        dir_layout = QHBoxLayout()
        dir_layout.addWidget(QLabel("Project Directory:"))
        dir_layout.addLayout(self.project_dir_selector.layout)
        layout.addLayout(dir_layout)
        
        parent_layout.addWidget(group)
    
    def create_generate_content_section(self, parent_layout):
        """Create blog content generation section"""
        group = QGroupBox("Generate Blog Content")
        layout = QVBoxLayout(group)
        
        # Subsection for moves.json
        moves_group = QGroupBox("Generate moves.json related content")
        moves_layout = QGridLayout(moves_group)
        
        generate_btn = QPushButton("Generate Pages")
        generate_btn.setToolTip("Generates pages and index page from $local/data/moves.json")
        generate_btn.clicked.connect(self.generate_moves_content)
        
        open_moves_dir_btn = QPushButton("Open Moves Directory")
        open_moves_dir_btn.setToolTip("Quick access to the moves folder")
        open_moves_dir_btn.clicked.connect(self.open_moves_directory)
        
        moves_layout.addWidget(generate_btn, 0, 0)
        moves_layout.addWidget(open_moves_dir_btn, 0, 1)
        
        layout.addWidget(moves_group)
        parent_layout.addWidget(group)
    
    def create_import_data_section(self, parent_layout):
        """Create data import section"""
        group = QGroupBox("Import Project Data [json|md]")
        layout = QVBoxLayout(group)
        
        # Import moves.json subsection
        import_group = QGroupBox("Import moves.json")
        import_layout = QGridLayout(import_group)
        
        # File selector
        self.import_file_selector = FileSelector(
            self, "Supported Files (*.md *.json);;Markdown Files (*.md);;JSON Files (*.json)",
            "Select a markdown or JSON file to convert and import"
        )
        
        import_layout.addWidget(QLabel("Select File:"), 0, 0)
        import_layout.addLayout(self.import_file_selector.layout, 0, 1, 1, 2)
        
        # Buttons
        convert_btn = QPushButton("Convert & Import")
        convert_btn.setToolTip("Convert selected file to JSON and replace existing moves.json")
        convert_btn.clicked.connect(self.convert_and_import_file)
        
        open_moves_btn = QPushButton("Open moves.json")
        open_moves_btn.setToolTip("Open the current moves.json file")
        open_moves_btn.clicked.connect(self.open_moves_json)
        
        import_layout.addWidget(convert_btn, 1, 0)
        import_layout.addWidget(open_moves_btn, 1, 1)
        
        layout.addWidget(import_group)
        parent_layout.addWidget(group)
    
    def create_export_data_section(self, parent_layout):
        """Create data export section"""
        group = QGroupBox("Export Project Data [json|md|docx]")
        layout = QVBoxLayout(group)
        
        # Export moves.json subsection
        export_group = QGroupBox("Export moves.json")
        export_layout = QGridLayout(export_group)
        
        # File name
        self.export_filename = QLineEdit()
        self.export_filename.setPlaceholderText("Enter filename (without extension)")
        self.export_filename.setToolTip("Name of the generated file")
        
        # Format dropdown
        self.export_format = QComboBox()
        self.export_format.addItems(EXPORT_FORMATS)
        self.export_format.setToolTip("Select export format")
        
        # Output directory
        self.export_dir_selector = DirectorySelector(
            self, "", "Directory where generated files will be created"
        )
        
        # Template file (for docx)
        self.template_file_selector = FileSelector(
            self, "Word Documents (*.docx);;All Files (*)",
            "Template file for DOCX export"
        )
        
        export_layout.addWidget(QLabel("Filename:"), 0, 0)
        export_layout.addWidget(self.export_filename, 0, 1)
        export_layout.addWidget(QLabel("Format:"), 0, 2)
        export_layout.addWidget(self.export_format, 0, 3)
        
        export_layout.addWidget(QLabel("Output Directory:"), 1, 0)
        export_layout.addLayout(self.export_dir_selector.layout, 1, 1, 1, 3)
        
        export_layout.addWidget(QLabel("Template File:"), 2, 0)
        export_layout.addLayout(self.template_file_selector.layout, 2, 1, 1, 3)
        
        # Buttons
        export_btn = QPushButton("Export Data")
        export_btn.setToolTip("Start the export process")
        export_btn.clicked.connect(self.export_moves_data)
        
        open_generated_dir_btn = QPushButton("Open Generated Directory")
        open_generated_dir_btn.setToolTip("Quick access to generated files directory")
        open_generated_dir_btn.clicked.connect(self.open_generated_directory)
        
        self.open_generated_file_btn = QPushButton("Open Latest Generated File")
        self.open_generated_file_btn.setToolTip("Opens the most recently generated file")
        self.open_generated_file_btn.setEnabled(False)
        self.open_generated_file_btn.clicked.connect(self.open_generated_file)
        
        button_layout = QHBoxLayout()
        button_layout.addWidget(export_btn)
        button_layout.addWidget(open_generated_dir_btn)
        button_layout.addWidget(self.open_generated_file_btn)
        
        export_layout.addLayout(button_layout, 3, 0, 1, 4)
        
        layout.addWidget(export_group)
        parent_layout.addWidget(group)
    
    def create_source_control_section(self, parent_layout):
        """Create source control section"""
        group = QGroupBox("Source Control")
        layout = QVBoxLayout(group)
        
        # Theme directory subsection
        theme_group = QGroupBox("Select Theme Directory")
        theme_layout = QGridLayout(theme_group)
        
        self.use_local_theme_cb = QCheckBox("Use Local Hugo Theme")
        self.use_local_theme_cb.setToolTip("Use local theme directory instead of GitHub repo")
        
        self.theme_dir_selector = DirectorySelector(
            self, "", "Local theme directory path"
        )
        
        theme_layout.addWidget(self.use_local_theme_cb, 0, 0, 1, 2)
        theme_layout.addWidget(QLabel("Theme Directory:"), 1, 0)
        theme_layout.addLayout(self.theme_dir_selector.layout, 1, 1)
        
        layout.addWidget(theme_group)
        
        # Hugo module commands subsection
        module_group = QGroupBox("Hugo Module Commands")
        module_layout = QGridLayout(module_group)
        
        tidy_btn = QPushButton("Hugo Mod Tidy")
        tidy_btn.setToolTip("Run 'hugo mod tidy' to update modules")
        tidy_btn.clicked.connect(lambda: self.run_hugo_command("hugo mod tidy"))
        
        update_btn = QPushButton("Update All Modules")
        update_btn.setToolTip("Run 'hugo mod get -u' to update all modules recursively")
        update_btn.clicked.connect(lambda: self.run_hugo_command("hugo mod get -u"))
        
        self.specific_version_field = QLineEdit()
        self.specific_version_field.setPlaceholderText("Enter specific version...")
        self.specific_version_field.setToolTip("Specific module version to get")
        
        get_version_btn = QPushButton("Get Specific Version")
        get_version_btn.setToolTip("Get specific module version")
        get_version_btn.clicked.connect(self.get_specific_module_version)
        
        module_layout.addWidget(tidy_btn, 0, 0)
        module_layout.addWidget(update_btn, 0, 1)
        module_layout.addWidget(self.specific_version_field, 1, 0)
        module_layout.addWidget(get_version_btn, 1, 1)
        
        layout.addWidget(module_group)
        parent_layout.addWidget(group)
    
    def create_hugo_run_section(self, parent_layout):
        """Create Hugo run section"""
        group = QGroupBox("Run Hugo")
        layout = QGridLayout(group)
        
        version_btn = QPushButton("Hugo Version")
        version_btn.setToolTip("Check Hugo version")
        version_btn.clicked.connect(lambda: self.run_hugo_command("hugo version"))
        
        server_btn = QPushButton("Hugo Server")
        server_btn.setToolTip("Run Hugo development server")
        server_btn.clicked.connect(lambda: self.run_hugo_command("hugo server"))
        
        server_no_fast_btn = QPushButton("Hugo Server (No Fast Render)")
        server_no_fast_btn.setToolTip("Run Hugo server without fast render")
        server_no_fast_btn.clicked.connect(lambda: self.run_hugo_command("hugo server --disableFastRender"))
        
        self.custom_params_field = QLineEdit()
        self.custom_params_field.setPlaceholderText("Additional parameters...")
        self.custom_params_field.setToolTip("Additional parameters for Hugo server")
        
        custom_server_btn = QPushButton("Hugo Server (Custom)")
        custom_server_btn.setToolTip("Run Hugo server with custom parameters")
        custom_server_btn.clicked.connect(self.run_hugo_server_custom)
        
        layout.addWidget(version_btn, 0, 0)
        layout.addWidget(server_btn, 0, 1)
        layout.addWidget(server_no_fast_btn, 1, 0)
        layout.addWidget(self.custom_params_field, 2, 0)
        layout.addWidget(custom_server_btn, 2, 1)
        
        parent_layout.addWidget(group)
    
    def setup_auto_save(self):
        """Setup automatic configuration saving"""
        self.save_timer = QTimer()
        self.save_timer.timeout.connect(self.save_settings)
        self.save_timer.start(5000)  # Save every 5 seconds
    
    def log(self, message: str, msg_type: str = "info"):
        """Log message to logging area"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        formatted_message = f"[{timestamp}] {message}"
        self.logging_area.log_message(formatted_message, msg_type)
    
    def run_hugo_command(self, command: str):
        """Run Hugo command in separate thread"""
        if self.command_thread and self.command_thread.isRunning():
            self.log("Another command is already running. Please wait.", "warning")
            return
        
        project_dir = self.project_dir_selector.get_directory()
        if not os.path.exists(project_dir):
            self.log(f"Project directory does not exist: {project_dir}", "error")
            return
        
        # Apply theme settings if using local theme
        if self.use_local_theme_cb.isChecked():
            theme_dir = self.theme_dir_selector.get_directory()
            if not FileManager.validate_theme_directory(theme_dir):
                self.log(f"Invalid theme directory: {theme_dir}. No theme files found.", "error")
                return
        
        self.command_thread = CommandThread(command, project_dir)
        self.command_thread.output_ready.connect(self.logging_area.log_message)
        self.command_thread.finished_signal.connect(self.command_finished)
        self.command_thread.start()
    
    def command_finished(self, success: bool, message: str):
        """Handle command completion"""
        msg_type = "info" if success else "error"
        self.log(message, msg_type)
    
    def get_specific_module_version(self):
        """Get specific module version"""
        version = self.specific_version_field.text().strip()
        if not version:
            self.log("Please enter a module version", "warning")
            return
        
        command = f"hugo mod get {version}"
        self.run_hugo_command(command)
    
    def run_hugo_server_custom(self):
        """Run Hugo server with custom parameters"""
        params = self.custom_params_field.text().strip()
        command = f"hugo server {params}" if params else "hugo server"
        self.run_hugo_command(command)
    
    def generate_moves_content(self):
        """Generate content from moves.json"""
        project_dir = self.project_dir_selector.get_directory()
        moves_json_path = os.path.join(project_dir, "data", "moves.json")
        
        if not os.path.exists(moves_json_path):
            self.log(f"moves.json not found at: {moves_json_path}", "error")
            return
        
        self.log("Generating content from moves.json...", "info")
        # Implementation would depend on your specific content generation logic
        self.log("Content generation completed", "info")
    
    def open_moves_directory(self):
        """Open moves directory in file explorer"""
        project_dir = self.project_dir_selector.get_directory()
        moves_dir = os.path.join(project_dir, "content", "rules", "move")
        
        if os.path.exists(moves_dir):
            self.open_directory(moves_dir)
        else:
            self.log(f"Moves directory does not exist: {moves_dir}", "warning")
            os.makedirs(moves_dir, exist_ok=True)
            self.log(f"Created moves directory: {moves_dir}", "info")
            self.open_directory(moves_dir)
    
    def open_directory(self, directory: str):
        """Open directory in system file explorer"""
        try:
            if sys.platform.startswith('win'):
                os.startfile(directory)
            elif sys.platform.startswith('darwin'):
                subprocess.run(['open', directory])
            else:
                subprocess.run(['xdg-open', directory])
            self.log(f"Opening directory: {directory}", "info")
        except Exception as e:
            self.log(f"Failed to open directory: {e}", "error")
    
    def convert_and_import_file(self):
        """Convert and import selected file"""
        source_file = self.import_file_selector.get_file()
        if not source_file or not os.path.exists(source_file):
            self.log("Please select a valid file to import", "warning")
            return
        
        # Confirmation dialog
        reply = QMessageBox.question(
            self, "Confirm Import",
            f"This will replace the existing moves.json with data from:\n{source_file}\n\nContinue?",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )
        
        if reply != QMessageBox.Yes:
            return
        
        project_dir = self.project_dir_selector.get_directory()
        target_file = os.path.join(project_dir, "data", "moves.json")
        
        os.makedirs(os.path.dirname(target_file), exist_ok=True)
        
        if FileManager.convert_file_to_json(source_file, target_file):
            self.log(f"Successfully imported and converted: {source_file}", "info")
        else:
            self.log(f"Failed to convert file: {source_file}", "error")
    
    def open_moves_json(self):
        """Open moves.json file"""
        project_dir = self.project_dir_selector.get_directory()
        moves_json_path = os.path.join(project_dir, "data", "moves.json")
        self.open_file(moves_json_path)
    
    def open_file(self, file_path: str):
        """Open file with system default application"""
        try:
            if os.path.exists(file_path):
                if sys.platform.startswith('win'):
                    os.startfile(file_path)
                elif sys.platform.startswith('darwin'):
                    subprocess.run(['open', file_path])
                else:
                    subprocess.run(['xdg-open', file_path])
                self.log(f"Opening file: {file_path}", "info")
            else:
                self.log(f"File does not exist: {file_path}", "warning")
        except Exception as e:
            self.log(f"Failed to open file: {e}", "error")
    
    def export_moves_data(self):
        """Export moves.json data in selected format"""
        filename = self.export_filename.text().strip()
        if not filename:
            self.log("Please enter a filename", "warning")
            return
        
        project_dir = self.project_dir_selector.get_directory()
        source_file = os.path.join(project_dir, "data", "moves.json")
        
        if not os.path.exists(source_file):
            self.log(f"Source file not found: {source_file}", "error")
            return
        
        export_dir = self.export_dir_selector.get_directory()
        if not export_dir:
            export_dir = os.path.join(project_dir, "local", "generated")
        
        os.makedirs(export_dir, exist_ok=True)
        
        format_ext = self.export_format.currentText()
        output_file = os.path.join(export_dir, f"{filename}{format_ext}")
        
        try:
            if format_ext == ".json":
                shutil.copy2(source_file, output_file)
            elif format_ext == ".md":
                # Convert JSON to Markdown
                with open(source_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(f"# {filename}\n\n")
                    f.write(f"```json\n{json.dumps(data, indent=2)}\n```\n")
            
            elif format_ext == ".docx":
                template_file = self.template_file_selector.get_file()
                if template_file and os.path.exists(template_file):
                    shutil.copy2(template_file, output_file)
                    self.log("DOCX export with template copying completed. Manual data insertion required.", "info")
                else:
                    self.log("Template file required for DOCX export", "warning")
                    return
            
            self.generated_file_path = output_file
            self.open_generated_file_btn.setEnabled(True)
            self.log(f"Export completed: {output_file}", "info")
            
        except Exception as e:
            self.log(f"Export failed: {e}", "error")
    
    def open_generated_directory(self):
        """Open generated files directory"""
        project_dir = self.project_dir_selector.get_directory()
        export_dir = self.export_dir_selector.get_directory()
        if not export_dir:
            export_dir = os.path.join(project_dir, "local", "generated")
        
        os.makedirs(export_dir, exist_ok=True)
        self.open_directory(export_dir)
    
    def open_generated_file(self):
        """Open the most recently generated file"""
        if self.generated_file_path and os.path.exists(self.generated_file_path):
            self.open_file(self.generated_file_path)
        else:
            self.log("No generated file to open", "warning")
    
    def load_settings(self):
        """Load settings from configuration file"""
        try:
            project_dir = self.project_dir_selector.get_directory()
            self.config = FileManager.load_config(project_dir)
            
            # Restore UI state from config
            if 'project_directory' in self.config:
                self.project_dir_selector.set_directory(self.config['project_directory'])
            
            if 'import_file' in self.config:
                self.import_file_selector.set_file(self.config['import_file'])
            
            if 'export_filename' in self.config:
                self.export_filename.setText(self.config['export_filename'])
            
            if 'export_format' in self.config:
                index = self.export_format.findText(self.config['export_format'])
                if index >= 0:
                    self.export_format.setCurrentIndex(index)
            
            if 'export_directory' in self.config:
                self.export_dir_selector.set_directory(self.config['export_directory'])
            
            if 'template_file' in self.config:
                self.template_file_selector.set_file(self.config['template_file'])
            
            if 'use_local_theme' in self.config:
                self.use_local_theme_cb.setChecked(self.config['use_local_theme'])
            
            if 'theme_directory' in self.config:
                self.theme_dir_selector.set_directory(self.config['theme_directory'])
            
            if 'specific_version' in self.config:
                self.specific_version_field.setText(self.config['specific_version'])
            
            if 'custom_params' in self.config:
                self.custom_params_field.setText(self.config['custom_params'])
            
            self.log("Settings loaded successfully", "info")
            
        except Exception as e:
            self.log(f"Failed to load settings: {e}", "warning")
    
    def save_settings(self):
        """Save current settings to configuration file"""
        try:
            project_dir = self.project_dir_selector.get_directory()
            
            # Collect current UI state
            self.config.update({
                'project_directory': project_dir,
                'import_file': self.import_file_selector.get_file(),
                'export_filename': self.export_filename.text(),
                'export_format': self.export_format.currentText(),
                'export_directory': self.export_dir_selector.get_directory(),
                'template_file': self.template_file_selector.get_file(),
                'use_local_theme': self.use_local_theme_cb.isChecked(),
                'theme_directory': self.theme_dir_selector.get_directory(),
                'specific_version': self.specific_version_field.text(),
                'custom_params': self.custom_params_field.text(),
                'last_saved': datetime.now().isoformat()
            })
            
            if FileManager.save_config(project_dir, self.config):
                # Only log successful saves occasionally to avoid spam
                if hasattr(self, '_last_save_log'):
                    if (datetime.now() - self._last_save_log).seconds > 30:
                        self.log("Settings auto-saved", "info")
                        self._last_save_log = datetime.now()
                else:
                    self.log("Settings saved", "info")
                    self._last_save_log = datetime.now()
            
        except Exception as e:
            self.log(f"Failed to save settings: {e}", "warning")
    
    def closeEvent(self, event):
        """Handle application close event"""
        self.save_settings()
        
        # Stop any running commands
        if self.command_thread and self.command_thread.isRunning():
            self.command_thread.terminate()
            self.command_thread.wait(3000)  # Wait up to 3 seconds
        
        self.log("Application closing", "info")
        event.accept()
    
    def show_confirmation_dialog(self, title: str, message: str) -> bool:
        """Show confirmation dialog and return user choice"""
        reply = QMessageBox.question(
            self, title, message,
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )
        return reply == QMessageBox.Yes

def main():
    """Main application entry point"""
    app = QApplication(sys.argv)
    
    # Set application properties
    app.setApplicationName("Hugo Blog Testing Tool")
    app.setApplicationVersion("1.0.0")
    app.setOrganizationName("Hugo Testing Tools")
    
    # Apply modern styling
    app.setStyleSheet("""
        QMainWindow {
            background-color: #f5f5f5;
        }
        
        QGroupBox {
            font-weight: bold;
            border: 2px solid #cccccc;
            border-radius: 8px;
            margin-top: 1ex;
            padding-top: 10px;
        }
        
        QGroupBox::title {
            subcontrol-origin: margin;
            left: 10px;
            padding: 0 5px 0 5px;
            background-color: #f5f5f5;
        }
        
        QPushButton {
            background-color: #0078d4;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: bold;
        }
        
        QPushButton:hover {
            background-color: #106ebe;
        }
        
        QPushButton:pressed {
            background-color: #005a9e;
        }
        
        QPushButton:disabled {
            background-color: #cccccc;
            color: #666666;
        }
        
        QLineEdit {
            padding: 6px;
            border: 1px solid #cccccc;
            border-radius: 4px;
            background-color: white;
        }
        
        QLineEdit:focus {
            border-color: #0078d4;
        }
        
        QComboBox {
            padding: 6px;
            border: 1px solid #cccccc;
            border-radius: 4px;
            background-color: white;
        }
        
        QComboBox:focus {
            border-color: #0078d4;
        }
        
        QTextEdit {
            border: 1px solid #cccccc;
            border-radius: 4px;
            background-color: white;
        }
        
        QCheckBox {
            spacing: 8px;
        }
        
        QCheckBox::indicator {
            width: 16px;
            height: 16px;
        }
        
        QCheckBox::indicator:unchecked {
            border: 2px solid #cccccc;
            border-radius: 3px;
            background-color: white;
        }
        
        QCheckBox::indicator:checked {
            border: 2px solid #0078d4;
            border-radius: 3px;
            background-color: #0078d4;
            image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDQuNUw0LjUgOEwxMSAxIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K);
        }
    """)
    
    # Create and show main window
    window = HugoBlogTestingTool()
    window.show()
    
    # Run application
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()
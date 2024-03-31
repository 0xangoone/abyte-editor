use std::{ fmt::Arguments, fs, io::Write, os::windows::process::CommandExt, process::Command};
use serde::{Serialize,Deserialize};
use serde_json;
use tauri;
use std::process;

#[derive(Debug,Serialize,Deserialize)]
struct ConfigStruct{
    language:String,
    runner_path:String,
    arguments:String,
    before_run:Vec<String>,
}
#[derive(Debug,Serialize,Deserialize)]
struct ProjectStruct{
    project_name:String,
    main_file:String,
}
#[derive(Clone,Debug,Serialize)]
struct FsElement{
    fs_type:String,
    name:String,
    path:String,
    parenter:String
}


#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn read_file(path:String)->String{
    match fs::read_to_string(path){
        Err(e)=>{return e.to_string()},
        Ok(e)=>{return e.to_string()},
    }
}
#[tauri::command]
fn read_files_bytes(path:String)->Vec<u8>{
    return fs::read(path).unwrap();
}
#[tauri::command]
fn save_file(content: &str, path: &str) -> String {
    let mut file = match fs::File::create(path) {
        Ok(file) => file,
        Err(e) => return format!("Error creating file: {}", e),
    };
    if let Err(e) = file.write_all(content.as_bytes()) {
        return format!("Error writing to file: {}", e);
    }
    String::new() 
}
#[tauri::command]
fn setup_project(name:String,path:String,language:String)->String{
    let mut project = ProjectStruct{
        project_name:name,
        main_file:String::new()
    };
    let mut config = ConfigStruct{
        language:"".to_string(),
        runner_path:"".to_string(),
        arguments:"".to_string(),
        before_run:Vec::new(),
    };
    let mut config_json = String::new();
    let mut project_json = String::new();
    match language.as_str(){
        "rs"=>{
            config = ConfigStruct{
                language:"rust".to_string(),
                runner_path:"cargo".to_string(),
                arguments:"run".to_string(),
                before_run:Vec::new(),
            };
            match fs::create_dir(path.clone()){
                Ok(())=>{}
                Err(e)=>{ return format!("error: {e}");}
            }
            match process::Command::new("cargo").arg("init")
                .current_dir(path.clone())
                .spawn(){
                    Err(e)=>return format!("error: {e}"),
                    _=>{},
                }
            project.main_file = "./src/main.rs".to_string();
        },
        "cs"=>{
            config = ConfigStruct{
                language:"csharp".to_string(),
                runner_path:"dotnet".to_string(),
                arguments:"run".to_string(),
                before_run:Vec::new(),
            };
            match fs::create_dir(path.clone()){
                Ok(())=>{}
                Err(e)=>{ return format!("error: {e}");}
            }
            match process::Command::new("dotnet").arg("new").arg("console").current_dir(path.clone()).spawn(){
                    Err(e)=>return format!("error: {e}"),
                    _=>{}
            }
                
            project.main_file = "./Program.cs".to_string();
            
        }
        "py"=>{
            config = ConfigStruct{
                language:"python".to_string(),
                runner_path:"py".to_string(),
                arguments:"./main.py".to_string(),
                before_run:Vec::new(),
            };
            project.main_file = "./main.py".to_string();
            match fs::create_dir(path.clone()){
                Ok(())=>{}
                Err(e)=>{ format!("error: {e}");}
            }
            let mut main = fs::File::create(format!("{path}\\main.py")).unwrap();
            main.write_all(b"print(\"hello world\")").unwrap();
            fs::create_dir(format!("{path}\\modules")).unwrap();
            fs::create_dir(format!("{path}\\resources")).unwrap();
        }
        _=>{
            match fs::create_dir(path.clone()){
                Ok(())=>{}
                Err(e)=>{ return format!("error: {e}");}
            }
            fs::File::create(format!("{path}\\main.{language}")).unwrap();
            project.main_file = format!("{path}\\main.{language}");
        }
        
    }

    config_json = serde_json::to_string(&config).unwrap();
    project_json = serde_json::to_string(&project).unwrap();
    match fs::File::create(format!("{path}\\config.json")){
        Ok(mut e)=>{e.write_all(&config_json.as_bytes()).unwrap();}
        _=>{}
    }match fs::File::create(format!("{path}\\project.json")){
        Ok(mut e)=>{e.write_all(&project_json.as_bytes()).unwrap();}
        _=>{}
    }
    String::new()
}
#[tauri::command]
fn exit_program(){
    std::process::exit(0);
}
#[tauri::command]
fn load_files(path:String)->Vec<FsElement>{
    let mut out:Vec<FsElement> = Vec::new();
    let content = fs::read_dir(path).unwrap();
    for i in content{
        let i = i.unwrap();
        let element = FsElement{
            fs_type:if i.path().is_file(){"file".to_string()}else{"dir".to_string()},
            name:i.file_name().into_string().unwrap(),
            path:i.path().display().to_string(),
            parenter:i.path().parent().unwrap().to_str().unwrap().to_string(),
        };
        out.push(element);
    }
    return out;
}
#[tauri::command]
fn get_file_parent(path:String)->String{
    let pathbuf = std::path::Path::new(&path);
    return pathbuf.parent().unwrap().to_str().unwrap().to_string();
}
#[tauri::command]
fn delete_file(path:String)->String{
    let pathbuf = std::path::Path::new(&path);
    if pathbuf.is_file(){
        match std::fs::remove_file(path){
            Err(e)=>{return format!("error: {e}");},
            _=>{}
        }
    }else{
        match std::fs::remove_dir(path){
            Err(e)=>{return format!("error: {e}");},
            _=>{}
        }
    }
    String::new()
}
#[tauri::command]
fn save_folder(path:String)->String{
    match fs::create_dir(path){
        Err(e)=>{return format!("error: {e}")},
        _=>String::new()
    }
}
#[tauri::command]
fn run_project(path:String)->String{
    let pathbuf = std::path::PathBuf::from(path.clone());
    let mut is_valid = false;
    if pathbuf.is_file(){
    }else if pathbuf.is_dir() && pathbuf.exists(){
        for i in fs::read_dir(pathbuf).unwrap(){
            let i = i.unwrap();
            if i.file_name() == "config.json"{
                is_valid = true;
                break;
            }
        }
    }
    if is_valid{
        let file = fs::File::open(format!("{path}\\config.json")).unwrap();
        let reader = std::io::BufReader::new(file);
        let config_json:ConfigStruct = serde_json::from_reader(reader).unwrap();
        let before_run = config_json.before_run.clone();
        for i in before_run{
            let mut d = i.split(" ").collect::<Vec<&str>>();
            let program_name = d[0];
            d.remove(0);
            let args = d.clone();
            println!("{}",program_name);
            println!("{:?}",args);
            match Command::new(program_name).current_dir(path.clone()).args(args).status(){
                Err(e)=>return format!("error: {e}"),
                _=>{}
            }
        }
        let mut runner = config_json.runner_path.clone();
        let args =  config_json.arguments.split(" ").collect::<Vec<&str>>();
        if runner.starts_with("./"){
            runner.remove(0);
            runner.remove(0);
            println!("{path}\\{runner}");
            match Command::new(format!("{path}\\{runner}")).current_dir(path.clone()).args(args).creation_flags(0x00000010).status(){
                Err(e)=>return format!("error: {e}"),
                _=>{}
            }
        }else{
            match Command::new(runner).current_dir(path.clone()).args(args).creation_flags(0x00000010).status(){
                Err(e)=>return format!("error: {e}"),
                _=>{}
            }
        }
        
        
    }else{
        return format!("config.json not found !");
    }
    String::new()
}
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
           read_file,
           save_file,
           exit_program,
           setup_project,
           load_files,
           get_file_parent,
           delete_file,
           read_files_bytes,
           save_folder,
           run_project,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

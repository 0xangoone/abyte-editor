import { message } from "@tauri-apps/api/dialog";
import {invoke} from "@tauri-apps/api/tauri";
const $ = (select:string) => document.querySelector(select);
function isString(variable: any): boolean {
    return typeof variable === 'string';
}
let project_path = localStorage.getItem("project_path");
if(project_path){
    localStorage.setItem("current_sel_folder",project_path);
}
interface FsElement {
    fs_type: string;
    name: string;
    path: string;
    parenter: string;
}
const load_files = async (path:string) => {
    try {
        let filesystem:FsElement[] = await invoke("load_files", { path });
        return filesystem;
    } catch (error) {
        console.error("Error loading files:", error);
        return [];
    }
};

let handle_loaded_files_into_UI=async(path:string)=>{
    if (path) {
        (async () => {
            try {
                let filesystem:FsElement[] = await load_files(path);
                console.log(typeof filesystem);
                let files_container = $(".files");
                if (files_container ) {
                    files_container.innerHTML = "";
                    for (let i = 0; i < filesystem.length; i++) {
                        let file = filesystem[i];
                        if(file.fs_type == "dir"){
                            files_container.innerHTML += `
                                <div class="element flexed">
                                    <img class="icon" src="../assets/folder-icon.png"/>
                                    <p>${file.name}</p>
                                    <hidden class="path">${file.path}</hidden>
                                    <hidden class="type">dir</hidden>
                                </div>
                            `;
                        }else{
                            files_container.innerHTML += `
                                <div class="element flexed">
                                    <img class="icon" src="../assets/file-icon.png"/>
                                    <p>${file.name}</p>
                                    <hidden class="path">${file.path}</hidden>
                                    <hidden class="type">file</hidden>
                                </div>
                            `;
                        }
                    }
                }
                document.querySelectorAll(".element").forEach(element => {
                    element.addEventListener("click", async(event) => {
                        let ClickedItem = event.currentTarget as HTMLElement;
                        let element_type = ClickedItem.querySelector(".type") as HTMLElement;
                        let element_path = ClickedItem.querySelector(".path") as HTMLElement;
                        if(element_type.innerHTML == "file"){
                            console.log(element_path.innerHTML);
                            let tpath = element_path.innerHTML;
                            if(tpath.endsWith(".png") || tpath.endsWith(".jpeg") || tpath.endsWith(".gif")){
                                let byte_array:Uint8Array = await invoke("read_files_bytes",{
                                    path:tpath
                                });
                                let binary = '';
                                byte_array.forEach(byte => {
                                    binary += String.fromCharCode(byte);
                                });
                                let bt = btoa(binary);
                                console.log(bt);
                                ($(".audio") as HTMLImageElement).style.display = "none";
                                ($(".image") as HTMLImageElement).src = "data:image;base64,"+bt;
                                const textarea = $(".numbered") as HTMLTextAreaElement;
                                textarea.style.display = "none";
                                ($(".image") as HTMLImageElement).style.display = "block";
                                localStorage.setItem("current_sel_file",element_path.innerHTML);
                            }else if(tpath.endsWith(".mp3") || tpath.endsWith(".mp4")){
                                ($(".audio") as HTMLImageElement).style.display = "block";
                                const textarea = $(".numbered") as HTMLTextAreaElement;
                                textarea.style.display = "none";
                                ($(".image") as HTMLImageElement).style.display = "none";
                                let byte_array:Uint8Array = await invoke("read_files_bytes",{
                                    path:tpath
                                });
                                let binary = '';
                                byte_array.forEach(byte => {
                                    binary += String.fromCharCode(byte);
                                });
                                let bt = btoa(binary);
                                console.log(bt);
                                if(tpath.endsWith(".mp3")){
                                    ($(".audio") as HTMLAudioElement).src = "data:audio/mp3;base64,"+bt;
                                }else{
                                    ($(".audio") as HTMLAudioElement).src = "data:video/mp4;base64,"+bt;
                                }
                                localStorage.setItem("current_sel_file",element_path.innerHTML);
                            }else{
                                ($(".audio") as HTMLImageElement).style.display = "none";
                                ($(".image") as HTMLImageElement).style.display = "none";
                                const textarea = $(".numbered") as HTMLTextAreaElement;
                                if(textarea){
                                    textarea.style.display = "block";
                                    textarea.value = await invoke("read_file",{path:element_path.innerHTML});
                                    console.log("file Clicked:", event);
                                    localStorage.setItem("current_sel_file",element_path.innerHTML);
                                }
                            }
                        }else if(element_type.innerHTML == "dir"){
                            console.log("folder Clicked:", event);
                            handle_loaded_files_into_UI(element_path.innerHTML);
                            localStorage.setItem("current_sel_folder",element_path.innerHTML);
                            localStorage.setItem("current_sel_file","");
                        }

                    });
                });
            } catch (error) {
                console.error("Error loading files:", error);
            }
        })();
    }
}
if(project_path){
    handle_loaded_files_into_UI(project_path);
}
$(".return")?.addEventListener("click",async()=>{
    if(localStorage.getItem("current_sel_folder") != project_path){
        let selected = localStorage.getItem("current_sel_folder");
        if(selected){
            let sel_parent:string = await invoke("get_file_parent",{
                path:selected
            })
            localStorage.setItem("current_sel_folder",sel_parent);
            console.log(sel_parent)
            handle_loaded_files_into_UI(sel_parent);
        }
    }
})
$(".delete")?.addEventListener("click",async()=>{
    if(localStorage.getItem("current_sel_file") != ""){
        let result:string = await invoke("delete_file",{
            path:localStorage.getItem("current_sel_file")
        });
        if(result != ""){
            message(result)
        }
        let current_sel_folder = localStorage.getItem("current_sel_folder");
        if(current_sel_folder){
            handle_loaded_files_into_UI(current_sel_folder);
        }
    }else if(localStorage.getItem("current_sel_folder") != ""){
        let result:string = await invoke("delete_file",{
            path:localStorage.getItem("current_sel_folder")
        });
        if(result != ""){
            message(result)
        }
        if(localStorage.getItem("current_sel_folder") != project_path){
            let selected = localStorage.getItem("current_sel_folder");
            if(selected){
                let sel_parent:string = await invoke("get_file_parent",{
                    path:selected
                })
                console.log(sel_parent)
                handle_loaded_files_into_UI(sel_parent);
            }
        }
    }
})
$("._save")?.addEventListener("click",async()=>{
    let textarea = $(".numbered");
    let path_of_save = localStorage.getItem("current_sel_file")
    if(path_of_save && textarea){
        let response:string = await invoke("save_file",{
            content:(textarea as HTMLTextAreaElement).value,
            path:path_of_save,
        });
        if(response != ""){
            await message(response)
        }
    }
})
$(".create")?.addEventListener("click",async()=>{
    let files = $(".files");
    if(files){
        files.innerHTML += `
            <div class="element new_file">
                   enter the file name:<input class="newfile_name"/>
                   folder?:<input class="isfolder" type="checkbox"/>
                <div class="flexed">
                    <button class="lcreate">create</button>
                    <button class="lcancel">cancel</button>
                </div>
            </div>
        `
        $(".lcreate")?.addEventListener("click",async()=>{
            let curpath = localStorage.getItem("current_sel_folder");
            if(curpath){
                let isfolder = ($(".isfolder") as HTMLInputElement).checked;
                if(isfolder){
                    let file_name = ($(".newfile_name") as HTMLInputElement).value;
                    if(file_name && file_name != ""){
                        let result:string = await invoke("save_folder",{
                            path:curpath+"\\"+file_name,
                        })
                        if(result != ""){
                            message(result)
                        }
                    }else{
                        message("please write the folder name or press cancel")
                    }
                }else{
                    let file_name = ($(".newfile_name") as HTMLInputElement).value;
                    if(file_name && file_name != ""){
                        let result:string = await invoke("save_file",{
                            content:"",
                            path:curpath+"\\"+file_name,
                        })
                        if(result != ""){
                            message(result)
                        }
                    }else{
                        message("please write the file name or press cancel")
                    }
                }
                let new_file = $(".new_file");
                if(new_file){new_file.remove()}
                handle_loaded_files_into_UI(curpath);
            }
        })
        $(".lcancel")?.addEventListener("click",()=>{
            let new_file = $(".new_file");
            if(new_file){new_file.remove()}
        })
    }
})
$(".run")?.addEventListener("click",async()=>{
    let result:string = await invoke("run_project",{
        path:project_path,
    });
    if(result != ""){
        message(result);
    }
})
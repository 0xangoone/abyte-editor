import { invoke } from "@tauri-apps/api/tauri";
import { open, ask,save, message } from '@tauri-apps/api/dialog';
const $ = (select:string)=>{return document.querySelector(select)};
let project_path = "";
$(".choose_btn")?.addEventListener("click",async()=>{
    let selected = await open({
        directory:true,
        multiple:false,
    })
    if(selected && !Array.isArray(selected)){
        project_path = selected;
    }
})
$(".create_btn")?.addEventListener("click",async()=>{
    if(($(".project_name") as HTMLInputElement).value == ""){
        let errorbox = $(".error_msg");
        if(errorbox){errorbox.innerHTML = "please write the project name"}
    }else if(project_path == ""){
        let errorbox = $(".error_msg");
        if(errorbox){errorbox.innerHTML = "please choose the project path"}
    }else{
    if(localStorage.getItem("language") == "other"){
        localStorage.setItem("project_name",($(".project_name") as HTMLInputElement).value)
        localStorage.setItem("project_path",project_path + "\\" + ($(".project_name") as HTMLInputElement).value);
        window.location.href = "other.html"
    }else{
        localStorage.setItem("project_name",($(".project_name") as HTMLInputElement).value)
        localStorage.setItem("project_path",project_path + "\\" + ($(".project_name") as HTMLInputElement).value);
        let result:string = await invoke("setup_project",{
            name:($(".project_name") as HTMLInputElement).value,
            path:project_path + "\\" + ($(".project_name") as HTMLInputElement).value,
            language:localStorage.getItem("language"),
        })
        if(result != ""){
            message(result);
        }else{
            window.location.href = "./editor.html"
        }
    }
      // :)
    }
});
$(".createother_btn")?.addEventListener("click",async ()=>{
    let language_excten = $(".language_name");
    if(language_excten){
        localStorage.setItem("language",(language_excten as HTMLInputElement).value);
        let result:string = await invoke("setup_project",{
            name:localStorage.getItem("project_name"),
            path:localStorage.getItem("project_path"),
            language:(language_excten as HTMLInputElement).value,
        });
        if(result != ""){
            message(result);
        }else{
            window.location.href = "./editor.html"
        }
    }
})
import { invoke } from "@tauri-apps/api/tauri";
import { open, ask,save } from '@tauri-apps/api/dialog';

let global_path:string = "empty";
const $ = (select:string)=>{return document.querySelector(select)};
const open_btn = $(".open");
if(open_btn){
  const open_file = async()=>{
    const selected = await open();
    if (Array.isArray(selected)) {
    
    } else if (selected === null) {
      
    } else {
      console.log(selected);
      const textarea = $(".numbered");
      if(textarea){
        global_path = selected;
        textarea.innerHTML = await invoke("read_file",{path:selected});
      }
    }
  }
  open_btn.addEventListener("click",open_file);
  
}
const save_btn = $(".save");
if(save_btn){
  const save_file =async () => {
    if (global_path != "empty"){
      const textarea = $(".numbered");
      if(textarea){
        let response:string = await invoke("save_file",{
          content:($(".numbered") as HTMLTextAreaElement).value,
          path:global_path,
        });
        if (response != ""){
          await ask(response,"Message");
        }
      }
    }else{
      await ask("please save as or open any file first","Message");
    }
  }
  save_btn.addEventListener("click",save_file);
}
if($(".save_as")){
  $(".save_as")?.addEventListener("click",async()=>{
    let path_of_save = await save();
    if(path_of_save){
      global_path = path_of_save;
      let response:string = await invoke("save_file",{
        content:($(".numbered") as HTMLTextAreaElement).value,
        path:path_of_save,
      });
      if(response != ""){await ask(response,"Message")}
    }
  })
}

//starting code editor mode:
$(".rs")?.addEventListener("click",()=>{
  console.log("clicked rs");
  localStorage.setItem("language","rs");
  window.location.href = "src/code-editor/index.html"
})
$(".cs")?.addEventListener("click",()=>{
  console.log("clicked cs");
  localStorage.setItem("language","cs");
  window.location.href = "src/code-editor/index.html"
})
$(".py")?.addEventListener("click",()=>{
  console.log("clicked py");
  localStorage.setItem("language","py");
  window.location.href = "src/code-editor/index.html"
})
$(".other")?.addEventListener("click",()=>{
  console.log("clicked other");
  localStorage.setItem("language","other");
  window.location.href = "src/code-editor/index.html"
})
const exit = ()=>{
  invoke("exit_program")
};
$(".exit")?.addEventListener("click",exit);

$(".open_old")?.addEventListener("click",async()=>{
  try{
    let selected = await open({filters: [{
      name: 'Json',
      extensions: ['json']
    }]});
    console.log(selected);
    if(selected && !Array.isArray(selected)){
      console.log(selected);
      if(selected.endsWith("\\project.json")){
        let sel_parent:string = await invoke("get_file_parent",{
          path:selected
        })
        localStorage.setItem("project_path",sel_parent);
        console.log(window.location.href);
        let button = $(".open_old")
        if(button){
          if(button.innerHTML == "open other project" ){
            window.location.href = window.location.href
          }else{
            window.location.href = "src/code-editor/editor.html"
          }
        }
        
      }else{
        await ask("choose an project.json file please")
      }
    }
    else{
      await ask("choose an project.json file please")
    } 
  } 
  catch(e){
    console.log(e);
  }
});
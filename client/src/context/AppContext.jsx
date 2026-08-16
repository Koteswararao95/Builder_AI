import {createContext,useContext,useState,useEffect,useCallback,useMemo} from 'react';
import api from '../api/api';
import {useNavigate} from 'react-router-dom';
// import App from '../App';
import {toast} from 'react-hot-toast';
import debounce from 'lodash.debounce';

const AppContext = createContext(undefined);

export function AppContextProvider({children}) {
    const navigate = useNavigate()

   // Auth State
   const [user,setUser]  = useState(null);
   const [loadingUser,setLoadingUser] = useState(true);


   //States
   const [projects,setProjects] = useState([]);
   const [loadingProjects,setLoadingProjects] = useState(true);
   const [activeProject,setActiveProject] = useState(null);
   const [loadingActiveProject, setLoadingActiveProject] = useState(true);
   const [chatLoading,setChatLoading] = useState(false);
   const [generatedProject,setGeneratedProject] = useState(false);
   const [activeFile,setActiveFile] = useState("/App.js");
   const [showCode,setShowCode] = useState(false);


   //Auth Actions
   const checkSession = async ()=>{
    try{
        const {data } = await api.get("/api/auth/me");
        setUser(data.user);
    }
    catch(error){
        setUser(null);

    } finally{
        setLoadingUser(false);
    }
   }

   useEffect(()=>{
    checkSession()
   },[])
  
   const login = async(email,password)=>{
    try{
        const{data} = await api.post("/api/auth/login",{email,password})
        setUser(data.user)
        toast.success("Welcome back!")
        navigate("/")

    } catch(err){
        console.error("Login failed:",err);
        const errMsg = err?.response?.data?.error || "Invalid email or password";
        toast.error(errMsg);
        throw new Error(errMsg);
    }
   }
   const register = async(name,email,password)=>{
    try{
        const{data} = await api.post("/api/auth/register",{name,email,password})
        setUser(data.user)
        toast.success("Account created successfully!")
        navigate("/")

    } catch(err){
        console.error("Registration failed:",err);
        const errMsg = err?.response?.data?.error || "Registration failed";
        toast.error(errMsg);
        throw new Error(errMsg);
    }
   }

   const logout = async()=>{
    try{
        await api.post("/api/auth/logout")
        setUser(null)
        setProjects([])
        setActiveProject(null)
        toast.success("Logged out successfully")
        navigate("/login")
    } catch(error){
        console.error("Logout failed:",error);
        toast.error("Logout failed");

    }
   }
   // project Actions
   const loadProjects = async()=>{
    if(!user) return;
    try{
        const {data} = await api.get("/api/projects")
        const normalized = Array.isArray(data) ? data : [];
        const merged = [...projects];

        for (const project of normalized) {
            if (!merged.some((item)=>item._id === project._id)) {
                merged.push(project);
            }
        }

        const shouldRestoreDefaults =
            !merged.some((project) => project?.name === "SaaSify Landing Page") ||
            !merged.some((project) => project?.name === "Personal Portfolio");

        setProjects(shouldRestoreDefaults ? projects : merged);
    } finally{
        setLoadingProjects(false)
    }
   }

     const loadProject = async(id,silent = false)=>{
        if(!user) return ;
        if(!silent) setLoadingActiveProject(true)
            try{
        const {data} = await api.get(`/api/projects/${id}`)
        setActiveProject(data);
        // Defacult file selection 
        const files = Object.keys(data.files);
        if (files.length>0){
            setActiveFile((prev)=>{
                if(files.includes(prev)) return prev;
                if(files.includes("/App.js")) return "/App.js";
                return files[0];

            })
        }
        }catch(err){
            console.error("Failed to load project:",err);
            if(!silent) {
                toast.error("Failed to load project details");
                navigate("/")
            }

        } finally{
            if(!silent) setLoadingActiveProject(false)
        }

     }
     // Automactically poll active project status if generating or pending
     useEffect(()=>{
        if(!activeProject?._id || !user) return;
          const isOnging = activeProject.status === 'generating' || activeProject.status ==="pending"|| activeProject.status === "revising";
    
         if(isOnging){
            setChatLoading(true);
            const interval = setInterval(()=>{
                loadProject(activeProject._id,true)
            },2000);
            return ()=> clearInterval(interval)
         }
         else{
            setChatLoading(false);
         }
     },[activeProject?._id,activeProject?.status,loadProject,user])



     const handleGenerate  =useCallback(
        async(prompt)=>{
            if(!user) return ;
            setGeneratedProject(true);
            try{
                 const {data} = await api.post("/api/projects",{ prompt });
                toast.success("AI Agent is planning structure...")
                navigate(`/builder/${data._id}`);

            }catch(err){
               console.error("Failed to generate project:",err);
               toast.error(err?.response?.data?.error || " Failed to generate project");
            }finally{
                setGeneratedProject(false);

            }

        },[navigate,user]

     )

     const handleDelete  = useCallback(
        async(id)=>{
            if(!user) return ;
           
            try{
                  await api.delete(`/api/projects/${id}`);
                  setProjects((prev)=>prev.filter((p)=>p._id !== id))
                  toast.success("Project deleted successfully")
            }catch(err){
               console.error("Failed to delete project:",err);
              toast.error("Failed to delete project");
            }

        },[user]

     )
     
     const handleChat = useCallback(
        async(prompt)=>{
            if(!activeProject || !user) return ;
            setChatLoading(true)
            try{
            const {data} = await api.post (`/api/projects/${activeProject._id}/chat`,{prompt});
            setActiveProject(data);
            if(data.errors && data.errors.length > 0){
                toast.error(`${data.errors.length} revision patch(es) failed`);
            }else{
                toast.success(`Updated to version ${data.version}`);
            }
            } catch(err){
                console.error("Revision request failed:",err);
                toast.error(err?.response?.data?.error || "Revision request failed");
            } finally{
                setChatLoading(false)
            }
        },[activeProject,user]
     )
      const debouncedSave = useMemo(
        ()=> debounce(async(files,id)=>{
            try{
            await api.put(`/api/projects/${id}/files`,{files})
            } catch(err){
                console.error("Failed to  auto-save files:",err);
                toast.error("Failed to save code modifications");
            }

        },1000),[],
      )

      useEffect(()=>{
        return ()=>{
            debouncedSave.cancel();
        }

      },[debouncedSave])

      const updateProjectFiles = useCallback(
            async(files)=>{
          if(!activeProject || !user) return;
          debouncedSave(files,activeProject._id)

        },[activeProject,user,debouncedSave]
      )


    return(
        <AppContext.Provider value={{
            user,
            loadingUser,
            login,
            register,
            projects,
            loadingProjects,
            activeProject,
            loadingActiveProject,
            chatLoading,
            generatedProject,
            activeFile,
            showCode,
            setActiveFile,
            setShowCode,
            loadProjects,
            loadProject,
            handleGenerate,
            handleDelete,
            handleChat,
            logout,
            updateProjectFiles
            

        }}>

            {children}
        </AppContext.Provider>
    )

}
export function useAppContext() {
    const context  = useContext(AppContext);
    if(context === undefined) {
        throw new Error('useAppContext must be used within a AppContextProvider');
    }   
    
    return context;
}
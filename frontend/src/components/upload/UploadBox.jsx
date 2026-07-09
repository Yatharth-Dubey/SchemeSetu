import { useState } from "react"
import api from "../../services/api"
export default function UploadBox(){
    const [file, setFile] = useState()
    async function upload(){
        const fd = new FormData()
        fd.append("file", file)
        await api.post("/api/upload", fd)
        alert("uploaded")
    }
    return(
        <div>
            <input type="file" onChange={e=>setFile(e.target.files[0])} />
            <button onClick={upload}>Upload</button>
        </div>
    )
}
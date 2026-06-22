import { useState } from "react";
import api from "../../services/api"

export default function ChatBox(){
    const[input, setInput] = useState("")
    const[reply, setReply] = useState("")

    async function send(){
        try{
            const res = await api.post("/api/chat", {
                message: input
            })
            setReply(res.data.response)
        }
        catch{
            setReply("error")
        }
    }
    return(
        <div>
            <input value={input} onChange={(e)=>setInput(e.target.value)}/>
            <button onClick={send}>Send</button>
            <p>Bot:{reply}</p>
        </div>
    )
}
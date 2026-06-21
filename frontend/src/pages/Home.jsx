import React, { useState } from 'react'
import api from '../services/api'

export default function Home() {

    const[msg, setMsg] = useState("")
    async function load(){
        const res = await api.get("/api/chat")
        setMsg(res.data.message)
    }

  return (
    <div>
        <h1>
            SchemeSetu
        </h1>
        <button onClick={load} >Connect</button>
        <p>{msg}</p>
    </div>
  )
}

import React, { useState } from 'react'
import ChatBox from "../components/chat/ChatBox"
import UploadBox from '../components/upload/UploadBox'

export default function Home() {
  return (
    <div>
        <h1>
            SchemeSetu
        </h1>
        <UploadBox/>
        <ChatBox/>
    </div>
  )
}

"use client"

import { useState } from "react"
import ExportButton from "../components/ExportButton"

export default function ExportPage() {
    const [src, setSrc] = useState("");

    return <div className="flex">
        <input className="border-2 border-solid" value={src} onChange={e => setSrc(e.target.value)}/>
        <ExportButton className="text-4xl font-extrabold text-white-900" imgsrc={src}></ExportButton>
    </div>
}
"use client"

import { useState } from "react"
import ExportButton from "../components/ExportButton"
import ModelPreview from "../components/ModelPreview";

export default function ExportPage() {
    const [src, setSrc] = useState("");

    return <div className="flex">
        <ModelPreview imgsrc="https://i0.wp.com/thetac.tech/wp-content/uploads/2024/09/placeholder-288.png?fit=1200%2C800&ssl=1&w=640"></ModelPreview>
    </div>
}
"use client"

import { useState } from "react"
import ExportButton from "../components/ExportButton"
import ModelPreview from "../components/ModelPreview";

export default function ExportPage() {
    const [src, setSrc] = useState("");

    return <div className="flex">
        <ModelPreview imgsrc="https://miro.medium.com/v2/resize:fit:1400/1*uNCVd_VqFOcdxhsL71cT5Q.jpeg"
        carType="minivan"></ModelPreview>
    </div>
}
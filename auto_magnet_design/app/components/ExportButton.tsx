"use client"

import { jsPDF } from "jspdf";
import { useEffect, useState } from "react";

interface ExportButtonProps {
    imgsrc: string
    className?: string
}

export default function ExportButton({imgsrc, className}: ExportButtonProps) {
    const [img, setImg] = useState<HTMLImageElement | null>(null);

    useEffect(()=>{
        const temp = new Image();
        temp.src = imgsrc;
        temp.onload = () => {
            setImg(temp);
        }
        return () => {temp.onload = () => {}};
    }, [imgsrc])

    //converts given image to pdf
    function convertToPDF() {
        if (!img) return undefined;
        let orientation: "l" | "p" = "l";
        if (img.width < img.height) orientation = "p";
        const result = new jsPDF({
            format: [img.width, img.height],
            unit: "px",
            orientation: orientation
        });
        result.addImage(img, 'PNG', 0, 0, img.width, img.height);
        return result.output("dataurlstring", {filename: "design.pdf"});
    }

    return <a className={className} href={convertToPDF()} download="design.pdf">Export as PDF</a>
}
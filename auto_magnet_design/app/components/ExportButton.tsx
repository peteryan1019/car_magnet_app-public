"use client"

import { jsPDF } from "jspdf";
import { useEffect, useState } from "react";

interface ExportButtonProps {
    imgsrc: string
    leftSide?: boolean,
    needsCut?: boolean,
    className?: string
}

export default function ExportButton({imgsrc, className, leftSide=false, needsCut=true}: ExportButtonProps) {
    const [img, setImg] = useState<HTMLImageElement | null>(null);

    useEffect(()=>{
        const temp = new Image();
        temp.src = imgsrc;
        temp.alt = "";
        temp.onload = () => {
            setImg(temp);
        }
        return () => {temp.onload = () => {}};
    }, [imgsrc, leftSide])

    // checks localstorage for car type and returns proper cut position
    function getCutPos(): number {
        const carType = localStorage.getItem("car_type");
        if (!carType) return 1/2;
        switch (carType) {
            case "small":
                return 1/5;
            case "medium":
                return 1/4;
            case "suv":
                return 1/4;
            case "minivan":
                return 1/2;
            case "truck":
                return 1/5;
        }
        return 1/2;
    }

    /*converts given image to pdfs and
    saves them as jsPDFs in a map with the following keys:
        "full"-the full image
        "left"-the left cut
        "right"-the right cut
    left and right will be undefined if needsCut is false
    */
    function convertToPDF(): Map<string, jsPDF> {
        const pdfs = new Map<string, jsPDF>();

        if (!img) return pdfs;

        let orientation: "l" | "p" = "l";
        if (img.width < img.height) orientation = "p";
        //create and save full image
        const fullImg = new jsPDF({
            format: [img.width, img.height],
            unit: "px",
            orientation: orientation
        });
        fullImg.addImage(img, 'PNG', 0, 0, img.width, img.height);
        pdfs.set("full", fullImg);

        if (!needsCut) return pdfs;

        //cut image and save halfs
        let cutPos = getCutPos();
        if (cutPos > 1 || cutPos < 0) cutPos = 1/2;
        if (leftSide) cutPos = 1 - cutPos;

        orientation = "l";
        if (img.width * cutPos < img.height) orientation = "p";
        const left = new jsPDF({
            format: [img.width * cutPos, img.height],
            unit: "px",
            orientation: orientation
        });
        left.addImage(img, 'PNG', 0, 0, img.width, img.height);
        pdfs.set("left", left);

        orientation = "l";
        if (img.width * (1 - cutPos) < img.height) orientation = "p";
        const right = new jsPDF({
            format: [img.width * (1-cutPos), img.height],
            unit: "px",
            orientation: orientation
        });
        right.addImage(img, 'PNG', -cutPos * img.width, 0, img.width, img.height);
        pdfs.set("right", right);
        return pdfs;
    }

    // downloads the pdfs made in convertToPDF
    function downloadDesign() {
        const pdfs = convertToPDF();

        pdfs.forEach((value, key) => {
            value.save(key + "-design.pdf");
        });
    }

    return <button className={className} onClick={downloadDesign}>Export as PDF</button>
}
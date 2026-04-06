// mydesigns/page.tsx
"use client"
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */

import { db } from "@/db";
import { designs } from "@/db/schema";
import { getDesigns } from "../actions/design-actions";
import ExportButton from "../components/ExportButton";
import DeleteDesignButton from "../components/deleteDesignButton"; 
import SendEmailButton from "../components/EmailDesignButton";
import Link from "next/link";
import ModelPreview from "../components/ModelPreview";
import { useEffect, useState } from "react";
import Modal from '@mui/material/Modal'; 

export default function MyDesignsPage() {
  const [userDesigns, setUserDesigns] = useState<any[]>([]);
  const [carType, setCarType] = useState("medium");
  const [isTwoDoor, setIsTwoDoor] = useState("false");
  const [leftSide, setLeftSide] = useState(false);
  const [displayImg, setDisplayImg] = useState("/sample.png")
  const [open, setOpen] = useState(false);

  async function setUpPage() {
    const designs = await getDesigns();

    setUserDesigns(designs);
    let t = null;
    t = localStorage.getItem("car_type");
    if (t) {setCarType(t);}
    t = localStorage.getItem("two_door");
    if (t === "true" || t === "false") {setIsTwoDoor(t);}
    t = localStorage.getItem("left_side");
    if (t === "true") {setLeftSide(true);}
  }
  useEffect(() => {
    setUpPage();
  }, []);


  function handleOpen(design: any) {
    setDisplayImg(design.imageUrl);
    setIsTwoDoor(design.two_doors);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  // ADDED: Function to instantly remove the deleted design from the React State
  const handleDesignDeleted = (deletedId: number) => {
    setUserDesigns((prevDesigns) => prevDesigns.filter((d) => d.id !== deletedId));
    
    // Optional: If the user deletes the design they are currently previewing, 
    // reset the preview image to the default sample.
    setDisplayImg((prevImg) => {
      const deletedDesign = userDesigns.find(d => d.id === deletedId);
      return (deletedDesign && deletedDesign.imageUrl === prevImg) ? "/sample.png" : prevImg;
    });
  };

  return (
    <main className="min-h-screen p-6 bg-slate-900 text-white font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Designs</h1>
          <Link
            href="/design"
            className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
          >
            Create New Design
          </Link>
        </div>

        {userDesigns.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-xl mb-4">You have no designs yet.</h2>
            <p className="text-white/70">Go to the Design page to generate some custom banners!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userDesigns.map((design: any) => (
              <div key={design.id} className="bg-slate-800 rounded-xl overflow-hidden shadow-2xl">
                <img
                  src={design.imageUrl || "/frame1.jpg"}
                  alt={`Saved design from ${new Date(design.dateCreated).toLocaleDateString()}`}
                  className="w-full h-auto cursor-pointer"
                  onClick={() => handleOpen(design)}
                />
                <div className="p-4 border-t border-slate-700 bg-slate-800 flex justify-between items-center">
                    <span className="text-sm text-slate-400 font-medium">
                        {new Date(design.dateCreated).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <ExportButton imgsrc={design.imageUrl} leftSide={leftSide} needsCut={design.two_doors}/>
                      
                      {/* ADDED: The onDelete prop is now passed down to the button */}
                      <SendEmailButton to={"simonmiyashita04@gmail.com"} imageUrl={design.imageUrl} />
                      <DeleteDesignButton 
                        id={design.id} 
                        onDelete={() => handleDesignDeleted(design.id)}
                      />
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal onClose={handleClose} open={open} keepMounted disableAutoFocus className="w-3/5 h-1/2 absolute m-auto">
        <div className="flex min-h-[calc(50vh-73px)] bg-slate-900">
            <div className="flex-[3] flex flex-col justify-center p-6">
                <ModelPreview
                    imgsrc={displayImg}
                    carType={carType}
                    isTwoDoor={isTwoDoor == "true"}
                    leftSide={leftSide}
                />
            </div>
        </div>
      </Modal>
    </main>
  );
}
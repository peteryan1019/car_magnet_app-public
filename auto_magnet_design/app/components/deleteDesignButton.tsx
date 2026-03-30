"use client";

import { useTransition, useState } from "react";
import { deleteDesignAction } from "../actions/design-actions";

export default function DeleteDesignButton({ id }: { id: number }) { // Change to string if your DB uses UUIDs
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);

  const handleConfirmDelete = () => {
    startTransition(async () => {
      const result = await deleteDesignAction(id);
      if (result?.error) {
        alert(result.error);
      }
      // Note: We don't necessarily need to close the modal manually here 
      // because if the delete is successful, the whole component unmounts!
      // But we'll close it just in case there's an error.
      setShowModal(false); 
    });
  };

  return (
    <>
      {/* The trigger button on the card */}
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-1.5 text-sm font-semibold text-white bg-yellow-600 rounded-md hover:bg-yellow-700 transition"
      >
        Delete
      </button>

      {/* The Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          
          {/* Modal Container */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header/Body */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">
                Delete Design?
              </h3>
              <p className="text-slate-400 text-sm">
                Are you sure you want to delete this design? This action cannot be undone and will permanently remove it from your collection.
              </p>
            </div>

            {/* Modal Footer (Buttons) */}
            <div className="bg-slate-900/50 p-4 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button
                onClick={handleConfirmDelete}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition flex items-center justify-center min-w-[80px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
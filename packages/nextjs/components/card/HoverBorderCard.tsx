import React from "react";

interface HoverBorderProps {
  children: React.ReactNode;
  showArrow?: boolean;
  click?: () => void;
  disabled?: boolean;
}

const HoverBorderCard: React.FC<HoverBorderProps> = ({ children, showArrow = false, click, disabled = false }) => {
  return (
    <div
      className={`p-5 border-2 border-transparent rounded-lg  
      ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "shadow-xl cursor-pointer text-accent-content hover:border-[#3647A4] flex flex-row justify-between items-center"
      } 
      bg-accent
      
      `}
      onClick={() => {
        if (!disabled && click) {
          click();
        }
      }}
    >
      {children}
      {showArrow && (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" id="rightarrow">
          <path
            d="M298.3 256L131.1 81.9c-4.2-4.3-4.1-11.4.2-15.8l29.9-30.6c4.3-4.4 11.3-4.5 15.5-.2L380.9 248c2.2 2.2 3.2 5.2 3 8.1.1 3-.9 5.9-3 8.1L176.7 476.8c-4.2 4.3-11.2 4.2-15.5-.2L131.3 446c-4.3-4.4-4.4-11.5-.2-15.8L298.3 256z"
            fill="#ffffff"
          ></path>
        </svg>
      )}
    </div>
  );
};

export default HoverBorderCard;

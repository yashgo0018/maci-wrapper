"use client";

import Image from "next/image";
import RegisterButton from "./_components/RegisterButton";
import type { NextPage } from "next";
import HeroImage from "~~/assets/private_voting.png";
import { useAuthUserOnly } from "~~/hooks/useAuthUserOnly";

const Home: NextPage = () => {
  useAuthUserOnly({ inverted: true });

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-4xl font-bold text-center">Private Voting Starter Kit with MACI</h1>

          <div className="flex flex-col-reverse md:flex-row justify-center items-center mt-10 sm:w-2/3 mx-auto gap-x-10 gap-y-5 mb-10">
            <div className="flex-1">
              <p className="text-lg mt-5 text-justify">
                This starter kit is designed to help you get started with private voting using the Minimal
                Anti-Collusion Infrastructure (MACI).
              </p>
              <div className="text-center">
                <RegisterButton />
              </div>
            </div>
            <div className="flex-1">
              <Image src={HeroImage} alt="MACI" className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

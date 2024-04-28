import axios from "axios";

export async function uploadToPinata(jsonData: any) {
  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
  const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT || "";

  const { data } = await axios.post(
    url,
    {
      // assuming client sends `nftMeta` json
      pinataContent: jsonData,
    },
    {
      headers: {
        Authorization: `Bearer ${pinataJWT}`,
      },
    },
  );

  return data.IpfsHash;
}

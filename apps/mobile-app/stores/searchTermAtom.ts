import { atom, useAtom } from "jotai";

const searchTermAtom = atom<string>("");

export const useSearchTerm = (): {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
} => {
  const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);
  return { searchTerm, setSearchTerm };
};

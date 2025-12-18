import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image 
        src="https://firebasestorage.googleapis.com/v0/b/yulacesso.appspot.com/o/yul-acesso-semfundo.png?alt=media&token=6f21c296-6d65-412e-95d6-05041951f0c2" 
        alt="LSPP do INSS Logo"
        width={40}
        height={40}
        />
      <span className="font-semibold text-xl text-primary">LSPP do INSS</span>
    </div>
  );
}

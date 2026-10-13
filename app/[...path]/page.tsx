import Jyo from '../jyo-ui';
import MiniPubFallback from '../mini-pub-fallback';
export default async function Page({params}:{params:Promise<{path:string[]}>}){const {path}=await params;return <>{['discover','explorer'].includes(path.join('/'))&&<MiniPubFallback/>}<Jyo/></>;}

import './styles.css';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'Sindh Flood Watch',description:'District flood information, source transparency and preparedness. Independent information service.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}

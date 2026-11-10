import Badge from '../common/Badge.jsx';
const tones={Pending:'warning',Confirmed:'info',Assigned:'neutral',Accepted:'info','Picked Up':'info','In Transit':'info','Out for Delivery':'warning',Delivered:'success',Failed:'danger',Cancelled:'danger'};
export default function OrderStatusBadge({status}){return <Badge tone={tones[status]||'neutral'}>{status}</Badge>}

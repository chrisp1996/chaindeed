import { redirect } from 'next/navigation';

export default function RealEstatePage() {
  redirect('/contracts/new/simple?type=residential');
}

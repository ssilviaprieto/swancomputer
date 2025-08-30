import { redirect } from 'next/navigation';

export default function Level2Index() {
  // Land on the puzzle route with an explicit flag
  redirect('/level2/false/nextLevel');
}


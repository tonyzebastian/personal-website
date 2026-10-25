import PanelPage from '@/components/panel/PanelPage';
import Image from 'next/image';

export const metadata = {
  title: "Mnemonic Signages \u2726 Tony Sebastian",
  description: "Mnemonic Signages",
};


export default function MnemonicSignages() {
    return (
        <PanelPage title="Mnemonic Signages" meta={["2 min read", "Jan 2024"]}>
        
            <section>
                <p>
                    I used to have difficulty remembering where I parked my car in large parking lots. There were times when I walked across the entire lot to find my car. To solve this, I began taking pictures of the pillar near where I parked. Recently, while photographing a pillar, I noticed an interesting pattern where illustrations are displayed next to the alphabet. After some research, I discovered that these types of signages are known as <strong className='text-slate-800'>Mnemonic Signages</strong>.
                </p>
            </section>


            <section className="flex justify-center">
                <Image src="/images/musings/mall_signs.png" alt="signs of parking indicators in mall parkings" className="w-full" width={700} height={300}/>
            </section>


            <section>
                <p>
                    This method is used to help individuals remember and identify locations or instructions more easily. The combination of a pictogram (like an igloo for I or Horse for H) with a number aids in navigation, as it creates a visual marker that can be more quickly and easily recalled than a number alone. This is especially useful in large, complex environments like parking garages, where it can be challenging to remember the precise location where one has parked. The symbol often has an associative link that makes it memorable, aiding in the recall of the specific location. <br/>
                    These types of mnemonic signages have been widely used in traffic and public areas for a long time, even before the evolution of digital design.
                </p>
            </section>


            <section className="flex justify-center">
                <Image src="/images/musings/road_signs.png" alt="road signs that indicate certain messages" className="w-full" width={600} height={300} />
            </section>


            <section>
                <p>
                    This type of mnemonic signage found in the physical world seems to have greatly influenced how we design interfaces today. Buttons with icons are a prime example of this influence in use.
                </p>
            </section>

            <section className="flex justify-center">
            <Image src="/images/musings/ui_mockups.png" alt="UI elements that resembles that of road signs" className="w-full max-w-full" width={2100} height={470} />
            </section>

        </PanelPage>
    );
}
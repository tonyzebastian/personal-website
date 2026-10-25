import Image from 'next/image';
import Script from 'next/script';

export const metadata = {
    title: 'Musings',
    description: 'A brief description of Tony Sebastian\'s work and interests.',
    keywords: 'design, art, cinematography, photography, travel',
  }

export default function perceived_wait() {

    return (
      <div id="top" className="flex flex-col items-start justify-center mx-auto max-w-[648px] mt-12 mb-16">
        <h1 className="mb-2 mx-6 text-slate-900">Reduce perceived wait times through visual delight</h1>
        <h6 className="mb-8 mx-6 text-slate-500">
            4 min read . May 2024
        </h6>

        <section className="mb-8 mx-6">
            <p>
                Staring at a blank screen as an app slowly loads is a surefire way to lose user attention. Whether it&apos;s loading a webpage or launching an app, users expect speed and efficiency. However, the loading process can often be a point of frustration, especially when greeted with a blank screen or a mundane loading indicator.
            </p>

            <blockquote className="mt-4 mb-2 pl-2 italic border-l-2 font-sans leading-loose tracking-wide text-sm text-slate-700 border-slate-400 quote">
                People can make rough decisions about a web page&apos;s visual appeal after being exposed to it for as little as 50 ms, which is 1/20 of a second.
            </blockquote>

            <a href="https://www.nngroup.com/articles/powers-of-10-time-scales-in-ux/" target="_blank" className=" rounded px-2 py-1 border border-slate-400  font-sans text-xs text-slate-900 hover hover:border-slate-400 hover:text-blue-600">
                Power of 10: Time Scales in User Experience
            </a>

            <p className="mt-4">
                This is where the importance of visual delight comes into play. Visual delight is not just about aesthetics; it&apos;s about creating a memorable and engaging experience for users. By incorporating visually appealing elements into the loading process, we can captivate users&apos; attention, reduce perceived wait times, and leave a lasting impression.
            </p>

     </section>

    <section className="mb-8 mx-6">
        <h2 className="mb-2">Current app launch experience of Postman</h2>
        
        <p>
            The Postman app currently opens with the standard loading indicator, providing no insight into the processes taking place behind the scenes. After a while the header is loaded and then the other UI elements of Postman. While this approach serves its purpose, it lacks personality and fails to keep users engaged during the waiting period. If by some reason the loading takes more time, it leads to frustration from the users.
        </p>

        <blockquote className="mt-4 mb-2 pl-2 italic border-l-2 font-sans leading-loose tracking-wide text-sm text-slate-700 border-slate-400 quote">
            If it takes longer than 0.1 seconds for the revised state to appear, then the response doesn&apos;t feel instantaneous — instead, it feels as if the computer is doing something to make the menu open.
        </blockquote>

        <blockquote className="mt-4 mb-2 pl-2 italic border-l-2 font-sans leading-loose tracking-wide text-sm text-slate-700 border-slate-400 quote">
            When the computer takes more than 0.1 second but less than 1 second to respond to your input, it feels like the computer is causing the result to appear. Although users notice the short delay, they stay focused on their current train of thought during the one-second interval.
        </blockquote>


        <blockquote className="mt-4 mb-2 pl-2 italic border-l-2 font-sans leading-loose tracking-wide text-sm text-slate-700 border-slate-400 quote">
            More than 10 seconds, and you break the flow. Users will often leave the site rather than trying to regain the groove once they&apos;ve started thinking about other things.
        </blockquote>

        <a href="https://www.nngroup.com/articles/powers-of-10-time-scales-in-ux/" target="_blank" className="px-2 py-1 border border-slate-300 rounded font-sans text-xs text-slate-900 hover hover:border-slate-400 hover:text-blue-600">
            Power of 10: Time Scales in User Experience
        </a>

        <div style={{ padding: '64.74% 0 0 0', position: 'relative', marginTop: '16px' }}>
            <iframe src="https://player.vimeo.com/video/967616311?h=ce700b5065&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} title="Postman Initial Loading"></iframe>
        </div>
        <Script src="https://player.vimeo.com/api/player.js"/>

    </section>

    <section className="mb-8 mx-6">
        <h2 className="mb-2">Make waiting delightful through visual magic</h2>
        
        <p>
            Instead of using a generic loading state, the aim is to enhance the overall loading experience using something that shows the personality of Postman while at the same time engaging for the users. By injecting the personality into the loading state, we are reflecting the brand&apos;s identity and values. Secondly, it will reduce user frustration by providing entertaining content to distract from the wait time. Finally, it will improve user retention by leaving a positive impression long after the loading process is complete.
            <br/>
            This animated illustration will not only entertain users but also provide visual feedback on the loading progress, making the experience more enjoyable and informative. 
        </p>

        <Image src="/images/musings/postman_new_loading.gif" alt="Postman Loading Illustration" className="w-full" width={600} height={300} />

        <div style={{ padding: '64.74% 0 0 0', position: 'relative', marginTop: '16px' }}>
            <iframe src="https://player.vimeo.com/video/967628802?h=8ffce8e111&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} title="Postman Initial Loading"></iframe>
            </div>
            <Script src="https://player.vimeo.com/api/player.js"/>

    </section>

    <section className="mb-8 mx-6">
        <h2 className="mb-2">Design Considerations</h2>
        
        <p>
            When designing the animated illustration, it was essential to strike the right balance between creativity and functionality. The illustration should complement the app&apos;s interface, projecting the personality of Postman in a visual tone that resonates with users.. Additionally, the messaging should be light-hearted and informative, offering insights into what&apos;s happening behind the scenes without overwhelming the user. <br/>Some other options that were considered: 
        </p>

        <Image src="/images/musings/design_considerations.gif" alt="design considerations" className="w-full" width={600} height={300} />

    </section>

    <section className="mb-6 mx-6">
        <h2 className="mb-2">Implementation Challenges</h2>
        
        <p>
            Integrating an animated illustration into the Postman app&apos;s loading process requires careful consideration of technical feasibility. When the user opens the app, various steps are executed, such as loading and initializing code for UI, fetching and rendering workspaces and collections. These processes demand a significant amount of rendering power and require downloading substantial data. The illustration should be optimized for performance to ensure smooth loading across different devices and network conditions. Additionally, thorough testing is necessary to assess whether incorporating such an animated illustration will impact the app launch performance.
            <br/>
            As we prioritize performance, let&apos;s embrace the power of visual delight to craft an app experience that users will love.
        </p>

    </section>

</div>
)
}
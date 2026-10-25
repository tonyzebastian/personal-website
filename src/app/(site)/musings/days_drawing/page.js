export const metadata = {
    title: 'Musings',
    description: 'A brief description of Tony Sebastian\'s work and interests.',
    keywords: 'design, art, cinematography, photography, travel',
  }

export default function day_drawing() {

    return (
      <div id="top" className="flex flex-col items-start justify-center mx-auto max-w-[648px] mt-12 mb-16">
        <h1 className="mb-2 mx-6 text-slate-900">Drawing everyday for 365 days: Some Learnings</h1>
        <h6 className="mb-8 mx-6 text-slate-500">
          3 min read . Jun 2021
        </h6>

        <section className="mb-6 mx-6">
          <p>
            On 2nd May 2020, I decided to start a new project - draw something every day for a year. 365 days later, I completed the project, and these are some of my learnings and realizations.
          </p>

          <ol className="list-decimal list-inside pl-2 space-y-2 counter">
              <li>As expected, my drawing skills levelled up - In comparison with last year&apos;s drawing, there is a massive improvement in colour usage and overall line quality.</li>
              <li>The average time taken to go from the ideation stage to a presentable or decent state decreased drastically. The latest illustrations have more details compared with last year&apos;s.</li>
              <li>As I progressed through this project, drawing something every day acted as fuel for all other day-to-day activities. It is much easier to enter the flow state now.</li>
              <li>This project allowed me to experiment with different styles of illustration. I now understand what style works for me and the areas that require improvement.</li>
              <li>On the flip side of things, there is burnout - I almost lost interest in drawing altogether. Some days I drew just for the sake of doing it, which had an overall negative effect.</li>
              <li>And yes, I did cheat on few days. By cheating, I mean tracing over images from Unsplash or Pexels, as I was completely out of creative juice to come up with an idea or do the initial sketch.</li>
              <li>Other projects and personal time took a hit. On average, I spend 1-2 hours daily on this project, which means very little time left for other stuff. </li>
              <li>Limited social media attention - 97% of the posts performed poorly on Instagram, where I did the daily posting. From the start of the project till now, I gained  80+ followers, and most of them were friends </li>
          </ol>

          <p>
              And that summarizes this project. Thank you for taking the time to read through my experience.<br/>
              You can find the entire drawing set on my <a href="https://pin.it/3PKGQjN2Y" target="_blank" className="underline underline-offset-2">Pinterest</a> board.
          </p>

        </section>
</div>
)
}
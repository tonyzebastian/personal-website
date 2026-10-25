import Link from 'next/link';

export const metadata = {
    title: 'Musings ✦ tonyzebastian',
    description: 'A visual product designer | Love to code | always tinkering with a side project',
    keywords: 'design, art, cinematography, photography, travel',
  
    twitter: {
      card: 'summary_large_image',
      site: '@tonyzebastian',
      creator: '@tonyzebastian',
      title: 'Tony Sebastian ✦ designer',
      description: 'A visual product designer | Love to code | always tinkering with a side project',
      image: 'https://tonyzeb.design/public/preview.png',
    },
    og: {
      title: 'Tony Sebastian ✦ designer',
      description: 'A visual product designer | Love to code | always tinkering with a side project',
      url: 'https://tonyzeb.design/',
      image: 'https://tonyzeb.design/public/preview.png',
      locale: 'en_EN',
    },
}

export default function Musings() {
    const musings = [
        { name: 'Reduce perceived wait times through visual delight', date: 'May 2024', link: '/musings/perceived_wait' },
        { name: 'Mnemonic Signages', date: 'Jan 2024', link: '/musings/mnemonic_signages' },
        { name: '365 days of drawing - Some learnings', date: 'Jun 2021', link: '/musings/days_drawing' },
        { name: '15 Months of remote work: A Recap', date: 'Nov 2020', link: '/musings/remote_work' },
        { name: 'Reviving a legacy system at Infosys', date: 'Nov 2018', link: '/musings/infosys_legacy' }
    ];

    const createListItem = (itemName, itemDate, itemLink) => {
        return (
            <li key={itemLink}>
            <Link href={itemLink} className="flex flex-col items-start py-4 px-4 hover:bg-slate-100 rounded"> 
                <span className="text-slate-300 font-sans font-medium text-sm tracking-wide overflow-hidden text-ellipsis whitespace-nowrap sm:block sm:truncate mb-1">{itemName}</span>
                <span className="text-slate-500 font-sans font-light text-sm">{itemDate}</span>
            </Link>
            </li>
        );
    };

    return (
        <main className=" mx-auto max-w-[500px] pt-8">
            <div className="mx-auto max-w-xl py-4 mb-8 px-4">
                <h1 className="mb-1 px-4 text-green-500">Musings</h1>
                <h6 className="px-4">
                    Snippets on design, art, cinematography and life. 
                </h6>
                <ul className="mt-8 space-y-2">
                    {musings.map(item => createListItem(item.name, item.date, item.link))}
                </ul>
            </div>
        </main>
    );
}
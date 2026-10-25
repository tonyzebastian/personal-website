export const metadata = {
    title: 'Musings',
    description: 'A brief description of Tony Sebastian\'s work and interests.',
    keywords: 'design, art, cinematography, photography, travel',
  }

export default function infosys_legacy() {


    return (

        <div id="top" className="flex flex-col items-start justify-center mx-auto max-w-[648px] mt-12 mb-16">

            <h1 className="mb-2 mx-6 text-slate-900">Reviving a legacy system at Infosys</h1>
            <h6 className="mb-8 mx-6 text-slate-500">
                7 min read . Nov 2018
            </h6>
        
            <section className="mb-8 mx-6">
                <p>
                As companies grow, asset management becomes crucial for smooth operations. Smaller firms manage with MS Excel or plug and play solutions, but multinational companies need dedicated systems due to their complexity. Large companies often build custom systems as off-the-shelf solutions fall short. This case study outlines how Infosys&apos; asset management team revamped their legacy system to boost efficiency, cut costs, and enhance control and accountability.
                </p>
            </section>

            <section className="mb-8 mx-6">
                <h2 className="mb-2">Large company, larger complexity</h2>
                <p>
                Infosys, a multinational based in Bangalore, India, employs around 250,000 people across 46 countries. With over eight development centers in India and smaller offices globally, Infosys manages a diverse range of assets, including software, hardware, land, buildings, intellectual property, and facilities like vehicles and furniture.
                <br/>
                Each type of asset at Infosys presents unique complexities and requires distinct accounting and management approaches. Some of these complexities include:
                </p>
                <ol className="list-decimal list-inside pl-2 space-y-2 counter">
                    <li><strong className="text-slate-700">Partial Ownership:</strong> Assets can be co-owned by Infosys and clients, such as intellectual property.</li>
                    <li><strong className="text-slate-700">Rental Agreements:</strong>  Assets may be rented from or to customers. Infosys often buys assets for clients, transferring ownership upon project completion.</li>
                    <li><strong className="text-slate-700">Special Economic Zones (SEZ):</strong>  Assets in SEZs must comply with specific government regulations and guidelines.</li>
                    <li><strong className="text-slate-700">Employee Allocation:</strong>  Managing asset allocation, deallocation, and extensions for over 250,000 employees involves complex workflows and approvals.</li>
                    <li><strong className="text-slate-700">Software Assets:</strong> Require management of licenses, compliance, versions, and cataloging, along with allocation processes.</li>
                    <li><strong className="text-slate-700">Asset Movement:</strong> Both inward and outward movements of assets involve varied workflows and approval processes based on the reason for the move.</li>
                </ol>

                <p className="pt-6">
                    Adding to the mix, assets are owned by different departments within Infosys, each with its own hierarchy and approval mechanisms:
                </p>
                <ul className="list-decimal list-inside pl-2 space-y-2 counter">
                    <li><strong className="text-slate-700">Hardware Assets:</strong> Items like desktops, laptops, and servers are managed by the Computer and Communication Department (CCD).</li>
                    <li><strong className="text-slate-700">Software Assets:</strong> Managed by the Software Department, a division under CCD.</li>
                    <li><strong className="text-slate-700">Facilitating Assets:</strong> Items such as tables, chairs, and desks are handled by the Facilities Department.</li>
                </ul>

                <p className="pt-6 space-y-2">
                In addition, several other departments at Infosys play crucial roles in asset management:
                </p>
                <ul className="list-decimal list-inside pl-2 space-y-2 counter">
                    <li><strong className="text-slate-700">SAP Team:</strong> Manages sales, purchases, and payments through the SAP system. The asset management system relies on data from the SAP system and vice versa.</li>
                    <li><strong className="text-slate-700">Corporate Accounting Group (CAG):</strong> Oversees the sale and purchase of assets from an accounting perspective. The CAG team maintains a dedicated system to track assets for accounting purposes and requires data from the asset management system.</li>
                    <li><strong className="text-slate-700">Tax Department:</strong> Handles all tax-related activities for buying, selling, and moving assets.</li>
                    <li><strong className="text-slate-700">Security Department:</strong> Ensures the safety of assets on campus. Their approval is necessary for the inward and outward movement of assets.</li>
                </ul>
            </section>

            <section className="mb-8 mx-6">
                <h2 className="mb-2">The Three Systems</h2>
                <p>
                The complexities and departments mentioned above evolved over time. Whenever a new requirement emerged, it was either added to the existing system or a new system was created. This resulted in three different systems to manage assets:
                </p>
                <ul className="list-decimal list-inside pl-2 space-y-2 counter">
                    <li><strong className="text-slate-700">Amanat:</strong> Manages the assetization of all asset types. It integrates with the SAP system to retrieve Purchase Order (PO) details necessary for determining the asset type and category. It also handles the allocation, deallocation, and extension of hardware assets (facility assets typically don&apos;t get allocated).</li>
                    <li><strong className="text-slate-700">Asset Logistics System (ALS):</strong> Manages the movement of hardware and facility assets, both inward and outward. It integrates with the Amanat system to obtain asset details.</li>
                    <li><strong className="text-slate-700">Software System:</strong> Manages everything related to software assets, integrating with the SAP system to get PO details for identifying software type and category.</li>
                </ul>
            </section>

            <section className="mb-8 mx-6">
                <h2 className="mb-2">Problems!! Pause - Taking a step back</h2>
                <p>
                Over time, as new features and processes were added, the systems began to show breakages, slowdowns, and other critical performance issues. It reached a point where further development of the existing systems could no longer resolve these issues.
                <br/>
                Additionally, an external compliance team identified major problems and recommended that Infosys&apos;s top management rethink their asset management process. Consequently, the management directed the asset team to identify all underlying issues and propose a comprehensive solution.
                </p>
            </section>

            <section className="mb-8 mx-6">
                <h2 className="mb-2">Pain Areas</h2>
                <p>
                The Asset team identified all known internal issues and conducted one-on-one meetings and group discussions with various departments and hierarchies to uncover additional underlying issues. The major pain points were:
                </p>
                <ul className="list-decimal list-inside pl-2 space-y-2 counter">
                    <li><strong className="text-slate-700">Integration with SAP System:</strong> Asset IDs, created in Amanat and the software system based on purchase orders (PO) from SAP, form the base data. The partial integration between Amanat-SAP and Software System-SAP leads to incomplete assetization details. Consequently, the team must manually add asset IDs from the back-end, making the process prone to human error.</li>
                    <li><strong className="text-slate-700">Hazy Integration Between Asset Systems:</strong> The integration between Amanat, Asset Logistics System (ALS), and the Software System is weak, leading to frequent breakages. These systems often operate in silos, requiring manual back-end updates for cross-data requirements.</li>
                    <li><strong className="text-slate-700">Outdated Workflows and Processes:</strong> Compliance requirements have evolved, changing workflows and processes. However, the system hasn&apos;t been updated accordingly, resulting in many processes being handled outside the system through email approvals, which are manually updated later.</li>
                    <li><strong className="text-slate-700">Lack of Feedback/Notifications:</strong> The system doesn&apos;t notify relevant parties upon the completion of approval processes. Users must manually check the system for updates, leading to reliance on email and direct chat. This lack of records causes audit problems later.</li>
                    <li><strong className="text-slate-700">Data Duplication and Corruption:</strong> Regular back-end updates cause data duplication and corruption. This requires continuous checks and rectification, adding extra manpower and cost to the company.</li>
                    <li><strong className="text-slate-700">Crippled Access Control and Security Features:</strong> There are around 25 roles across the three systems, with many repetitive roles having slight variations. No approval mechanism exists for role access, and many application pages are not properly tested, making them vulnerable to external attacks.</li>
                    <li><strong className="text-slate-700">No Service Level Agreements (SLAs):</strong> The current systems lack defined SLAs for processes, leading to indefinite delays. Requestors often rely on email reminders to get tasks completed.</li>
                </ul>
            </section>

            <section className="mb-8 mx-6">
                <h2 className="mb-2">The Crucial Decision</h2>
                <p>
                The Asset team shared their findings with top management and all relevant stakeholders. They highlighted the major pain points, emphasizing the integration issues, outdated workflows, lack of feedback mechanisms, data duplication, and system architecture problems.
                <br/>
                To address these issues and accommodate future requirements, the team recommended developing a new system with a modular architecture - the Asset Management System (AMS). This new system would be designed to seamlessly integrate with existing systems, support updated workflows, provide real-time notifications, ensure robust data management, and enhance security and access control.
                <br/>
                After numerous meetings and detailed discussions, management and stakeholders reviewed the proposal thoroughly. They considered the long-term benefits of implementing a scalable and efficient AMS, which would streamline asset management processes, reduce operational costs, and improve overall accountability.
                <br/>
                With a clear understanding of the necessity and potential impact of the new system, the management and stakeholders gave their approval, signing off on the proposal to develop the new Asset Management System.
                </p>
            </section>

            <section className="mb-8 mx-6">
                <h2 className="mb-2">The Plan and Execution</h2>
                <p>
                A step-by-step plan was created to achieve the proposal:
                </p>
                <div>
                    <h3 className="my-2">Requirement Gathering & User Research</h3>
                    <p>
                    The existing three systems lacked proper documentation, so the first step was to thoroughly understand and document the current system. Once the documentation was complete, it was shared with different stakeholder groups to educate them on the existing features and processes.
                    <br/>
                    The stakeholders reviewed the documentation and provided feedback, suggesting changes and new additions. These suggestions were then refined into workflows and processes. Detailed discussions with the stakeholders helped prioritize the importance of each step, leading to the consolidation of steps and the elimination of redundant processes.
                    <br/>
                    Additionally, the team conducted sessions with employees at different levels within each stakeholder group to understand their usage of the system and the real-time problems they faced. This approach helped uncover ground realities and assess the employees&apos; technical literacy, providing new insights that contributed to improving the Information Architecture.
                    </p>
                </div>

                <div>
                    <h3 className="my-2">Application Architecture</h3>
                    <p>
                    The new system will adopt a modular structure, with Asset IDs serving as the base data and integration with the SAP system being pivotal. Master databases will be established for Hardware, Software, and Facility asset IDs, along with an employee details database updated from the HR system. Each module will have its own database, governed by specific rules and restrictions.
                </p>
                <ul className="list-decimal list-inside pl-2 space-y-2 counter">
                    <li><strong className="text-slate-700">Inward Module:</strong> This handles various movements to an Infosys Campus, such as delivery of new assets, receipt of repaired assets, or transfers from other campuses. Workflows will vary based on asset type, owner, and reason for inwarding.</li>
                    <li><strong className="text-slate-700">Assetization Module:</strong> Utilising Purchase Order (PO) details and associated inward requests, this module generates assetization requests. Software assets can be assetized without a physical delivery, with asset IDs automatically assigned based on PO details.</li>
                    <li><strong className="text-slate-700">Allocation/Deallocation/Extension (Hardware):</strong> Assets are allocated to employees, each type having distinct workflows. For instance, desktops can be directly allocated, while laptops require manager approval and security gate pass for off-campus use. Automatic extension/deallocation occurs based on employee status changes.</li>
                    <li><strong className="text-slate-700">Software Module:</strong> This module oversees software-related processes, including License Management, Compliance, Version Control, Catalog Management, and allocation/deallocation/extension.</li>
                    <li><strong className="text-slate-700">Outwarding/Movement Module:</strong> Responsible for all campus-to-outside movements, like asset repairs, inter-campus transfers, or asset disposal. Workflows adjust based on asset type, owner, movement type, and reason, ensuring allocated assets are not inadvertently moved. Deallocation precedes any movement request for allocated assets.</li>
                </ul>
                </div>

                <div>
                    <h3 className="pt-4">User Interface and role management</h3>
                    <p>
                    Infosys employs an internal design system for its applications, which will serve as the foundation for the AMS (Asset Management System) UI and interactions, albeit with some customizations.
                    <br/>
                    Streamlining roles is crucial; currently, there are over 25 roles across the three systems, with redundancies and duplications. By consolidating roles, we&apos;ve reduced the count to 15.
                    <br/>
                    AMS roles will be overseen by a centralized system managing roles for all internal applications, ensuring proper configuration and access. Access permissions will be granted exclusively by top officials within each stakeholder group.
                    </p>
                </div>


                <div>
                    <h3 className="pt-4">Application Development</h3>
                    <p>
                    We first broke down the requirements into separate features. Then, we created wireframes for each feature and page. Once these wireframes were approved, we began the development phase. The application development follows the agile methodology.
                    </p>
                </div>

                <div>
                    <h3 className="pt-4">Training & Release</h3>
                    <p>
                    Once a module is developed and tested, it&apos;s released to stakeholders. Before the release, users are trained on the application&apos;s features. Detailed help documents are provided for reference.
                    <br/>
                    Module releases are phased, starting with 1-2 campuses and selected stakeholder groups. Feedback is gathered and issues addressed before wider release.
                    </p>
                </div>

                <div>
                    <h3 className="pt-4">Reassess and Rectify</h3>
                    <p>
                    AMS faced several challenges typical of product development. Conflict arose among stakeholders despite initial agreement on requirements and architecture, causing delays. Changes to processes or requirements after module releases added extra work for the development team. Additionally, some users were reluctant to adopt the new system, necessitating further training.
                    </p>
                </div>
            </section>

            <section className="mb-6 mx-6">
                <h2 className="mb-2">Conclusion</h2>
                <p>
                As of the end of 2019, the team had successfully completed 75% of the modules. A significant lesson learned from this project was navigating the complexities of revamping a product within a traditional organization with multiple layers of hierarchy and stakeholders.
                </p>
            </section>

        </div>
        )
    }

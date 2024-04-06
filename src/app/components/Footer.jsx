import { SiInstagram, SiWhatsapp } from "@icons-pack/react-simple-icons"
import Link from "next/link"
import { MaterialSymbol } from "react-material-symbols"
import Container from "./Container"

const Footer = () => {
    return (
        <footer className="bg-blue-60 backdrop-blur-sm">
            <Container className="py-4 max-w-full">
                <div className="flex max-lg:flex-col lg:items-start gap-8 justify-between gap-y-5">
                    <div className="basis-1/3">
                        <Link href="/" className="flex gap-2 items-center">
                            <div className="w-5">
                                <img
                                    className="w-full h-auto"
                                    alt="Selfless Sewa NGO Logomark"
                                    id="logo"
                                    src={"selfless-sewa-logo.svg"}
                                />
                            </div>
                            <p id="word-mark" className="font-display font-semibold text-title-md text-nowrap">
                                Selfless Sewa
                            </p>
                        </Link>
                    </div>
                    <div className="grow">
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(20ch,1fr))] gap-8 gap-y-4 [&_ul]:flex [&_ul]:gap-2 [&_ul]:flex-col">
                            <div>
                                <p className="text-title-md font-medium mb-2">Contact</p>
                                <ul className="font-light tracking-wider">
                                    <li className="flex items-center gap-2">
                                        <SiWhatsapp size={18} />
                                        +91 782 708 6428
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <MaterialSymbol icon="alternate_email" size={20} className="-mx-0" weight={300} />
                                        selflesssewango@gmail.com</li>
                                    <li className="flex items-center gap-2">
                                        <SiInstagram size={18} />
                                        <Link href='#'>@selflesssewa</Link>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <p className="text-title-md font-medium mb-2">Volunteer</p>
                                <ul className="font-light tracking-wider">
                                    <li>
                                        <Link href="#">Become a Sewak</Link>
                                    </li>
                                    <li>
                                        <Link href="#">Departments</Link>
                                    </li>
                                    <li>
                                        <Link href="#">Rules</Link>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <p className="text-title-md font-medium mb-2">About</p>
                                <ul className="font-light tracking-wider">
                                    <li>
                                        <Link href="#">Team</Link>
                                    </li>
                                    <li>
                                        <Link href="#">Projects</Link>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <p className="text-title-md font-medium mb-2">Collab</p>
                                <ul className="font-light tracking-wider">
                                    <li>prselflesssewango@gmail.com</li>
                                </ul>
                            </div>
                        </div>
                        <p className="text-body-md font-light mt-6 opacity-90 tracking-wider">copyright info</p>
                    </div>
                </div>
            </Container>
        </footer>
    )
}

export default Footer

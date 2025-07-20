import Link from "next/link";
import { Twitter, Facebook, Instagram } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-white border-t border-[#F6E8D6] py-6">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Logo and Description */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-[#FFE5D4] rounded-full flex items-center justify-center">
                                <span className="text-gray-900 text-xs font-bold">W</span>
                            </div>
                            <span className="text-base font-semibold text-gray-900">Waves Map</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">
                            Discover and explore events happening around the world through our interactive map platform.
                        </p>
                        <div className="flex gap-2">
                            <Link href="#" className="text-gray-400 hover:text-[#FFE5D4]">
                                <Twitter className="w-4 h-4" />
                            </Link>
                            <Link href="#" className="text-gray-400 hover:text-[#FFE5D4]">
                                <Facebook className="w-4 h-4" />
                            </Link>
                            <Link href="#" className="text-gray-400 hover:text-[#FFE5D4]">
                                <Instagram className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Features */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3 text-sm">Features</h3>
                        <ul className="space-y-1 text-xs text-gray-600">
                            <li><Link href="#" className="hover:text-gray-900">Interactive Maps</Link></li>
                            <li><Link href="#" className="hover:text-gray-900">Event Discovery</Link></li>
                            <li><Link href="#" className="hover:text-gray-900">Real-time Updates</Link></li>
                            <li><Link href="#" className="hover:text-gray-900">Event Creation</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3 text-sm">Support</h3>
                        <ul className="space-y-1 text-xs text-gray-600">
                            <li><Link href="#" className="hover:text-gray-900">Help Center</Link></li>
                            <li><Link href="#" className="hover:text-gray-900">Contact Us</Link></li>
                            <li><Link href="#" className="hover:text-gray-900">API Documentation</Link></li>
                            <li><Link href="#" className="hover:text-gray-900">Community</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3 text-sm">Legal</h3>
                        <ul className="space-y-1 text-xs text-gray-600">
                            <li><Link href="#" className="hover:text-gray-900">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-gray-900">Terms of Service</Link></li>
                            <li><Link href="#" className="hover:text-gray-900">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-[#F6E8D6] mt-4 pt-4 text-center">
                    <p className="text-xs text-gray-600">
                        © 2025 Waves Map. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}

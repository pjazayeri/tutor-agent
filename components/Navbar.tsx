// components/Navbar.tsx
import Link from "next/link";

const Navbar = () => {
    return (
        <nav className="bg-gray-800 text-white py-4 px-8 shadow-md">
            <ul className="flex space-x-4">
                <li>
                    <Link href="/" className="hover:text-gray-400">Home</Link>
                </li>
                <li>
                    <Link href="/about" className="hover:text-gray-400">About</Link>
                </li>
                <li>
                    <Link href="/contact" className="hover:text-gray-400">Contact</Link>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;

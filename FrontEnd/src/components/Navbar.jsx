import React from "react";
import { UserCircle } from "lucide-react";
function Navbar() {

    return (
        <header
            className="
                fixed
                top-0
                left-0
                right-0
                md:left-64
                h-16
                bg-white
                border-b
                border-gray-200
                z-40
            "
        >

            <div
                className="
                    h-full
                    px-4
                    md:px-6
                    flex
                    items-center
                    justify-between
                "
            >
                <div className="flex items-center gap-2">

                    <UserCircle
                        size={20}
                        className="text-blue-600"
                    />
                    <span
                        className="
                            hidden
                            sm:block
                            text-sm
                            font-medium
                            text-gray-700
                        "
                    >
                        Admin
                    </span>

                </div>

            </div>

        </header>
    );
}

export default Navbar;

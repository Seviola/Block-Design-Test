import coverotakatik from "../assets/coverott.webp";
import balokmerahputih from "../assets/balokmerahputih.webp";
import {Link} from "react-router-dom";

export function Home() {
  return (
    <>
    <section className="relative min-h-[600px] sm:min-h-[650px] lg:min-h-[700px] flex items-center overflow-hidden">
      <img
        src={coverotakatik}
        alt="Otak Atik Merah Putih"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay putih  */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/10"></div>

      {/* Content */}
      <div className="relative w-full px-5 sm:px-8 md:px-12 lg:px-16">
        <div className="max-w-xl">

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-4 leading-tight flex flex-wrap items-baseline gap-2 sm:gap-3">
            <span className="text-red-600">BRAINBLOCK</span>
            <span className="text-black">AI</span>
          </h1>

          <p className="mt-5 sm:mt-6 text-gray-700 text-base sm:text-lg leading-7 sm:leading-9">
            <span className="text-red-600 font-bold text-lg sm:text-xl lg:text-2xl">
              Sering Hilang Fokus dan Gampang Lupa?
            </span>{" "}
            <br />
            <span className="text-black font-bold text-lg sm:text-xl lg:text-2xl">
            Jangan-jangan Otakmu Kena Brainrot!
            </span>
            <br />
            Di era gempuran konten kilat, kemampuan fokus kita terus diuji. <br></br>Cukup bermain dengan balok merah-putih sesuai pola, dan skor ketangkasanmu langsung muncul secara otomatis. <br />
            BRAINBLOCK AI: Deteksi Dini, Proteksi Otak Maksimal!
          </p>

          <div className="mt-7 sm:mt-10">
            <Link
              to="/register"
              className="inline-block px-6 sm:px-8 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition">
              Coba Sekarang
            </Link>
          </div>
        </div>
      </div>
    </section>

    <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Judul */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 text-red-600">
            BRAINBLOCK AI
          </h2>
          <p className="mt-5 text-gray-600 max-w-3xl mx-auto text-base sm:text-lg leading-7 sm:leading-8 px-2">
          Novasi Deteksi Dini Kemampuan Kognitif Melalui Media Permainan Interaktif Berbasis AI
          </p>
        </div>

        {/* Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">

          <div className="bg-white rounded-2xl p-8 shadow-sm border-2 border-transparent hover:border-red-600 hover:shadow-lg transition">
            <h3 className="text-2xl font-semibold mb-4 text-center">
            Instrumen Fisik
            </h3>
            <p className="text-gray-600 leading-7 text-justify">
            Menggunakan set Balok Merah Putih (Block Design Test) sebagai media tes interaktif untuk merangsang ketangkasan visual, fokus, dan pemecahan masalah secara nyata
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border-2 border-transparent hover:border-red-600 hover:shadow-lg transition">
            <h3 className="text-2xl font-semibold mb-4 text-center">
            Stimulasi Otak
            </h3>
            <p className="text-gray-600 leading-7 text-justify">
            Melalui tantangan menyusun pola balok, metode ini dirancang untuk merangsang logika berpikir kritis, pemecahan masalah, dan daya ingat secara aktif
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border-2 border-transparent hover:border-red-600 hover:shadow-lg transition">
            <h3 className="text-2xl font-semibold mb-4 text-center">
            Analitik Cerdas
            </h3>
            <p className="text-gray-600 leading-7 text-justify">
            Mengenalkan teknologi AI yang mengolah data performa peserta permainan untuk memberikan wawasan kognitif secara visual serta membantu deteksi dini potensi masalah kognitif
            </p>
          </div>

        </div>
      </div>
    </section>

    <section className="relative min-h-[650px] sm:min-h-[700px] flex items-center overflow-hidden">
    {/* Background */}
    <img
      src={balokmerahputih}
      alt="Balok Merah Putih"
      className="absolute inset-0 w-full h-full object-cover object-center lg:object-center"/>

    {/* Overlay */}
    <div className="absolute inset-0 bg-gradient-to-l from-white via-white/90 to-white/10"></div>

    {/* Content */}
    <div className="relative w-full px-5 sm:px-8 md:px-12 lg:px-16 flex justify-center lg:justify-end">
      <div className="max-w-xl">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-4 leading-tight">
        Balok <span className="text-red-600">Merah</span> Putih</h2>
        <p className="mt-5 sm:mt-6 text-gray-700 text-base sm:text-lg leading-7 sm:leading-9">
        Balok Merah Putih merupakan media utama dalam permainan
        BRAINBLOCK AI. Dengan menyusun balok sesuai pola yang diberikan,
        pengguna dapat melatih kemampuan visual, konsentrasi,
        dan pemecahan masalah melalui berbagai tingkat kesulitan.</p>

        <div className="mt-8 sm:mt-10 space-y-5 sm:space-y-6">
          <div className="flex gap-3 sm:gap-4">
            <div className="text-red-600 text-2xl">✔</div>
            <div>
              <h3 className="font-semibold text-lg sm:text-xl">
                Produk Food Grade</h3>
              <p className="text-gray-600 text-sm sm:text-base leading-6">
              Balok aman dan tidak mengandung zat kimia berbahaya.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-red-600 text-2xl">✔</div>
            <div>
              <h3 className="font-semibold text-xl">
              Material Kayu Berkualitas
              </h3>

              <p className="text-gray-600">
                Sentuhan alami kayu pilihan yang halus dan tidak tajam.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-red-600 text-2xl">✔</div>
            <div>
              <h3 className="font-semibold text-xl">
              Nyaman Digunakan
              </h3>

              <p className="text-gray-600 leading-7">
              Desain ergonomis yang nyaman digenggam dan dimainkan</p>

            </div>
          </div>

        {/* Floating WhatsApp */}
        <a
          href="https://wa.me/6285645399871"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Hubungi CS melalui WhatsApp"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 hover:scale-110 transition-all duration-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="white"
            className="w-6 h-6 sm:w-8 sm:h-8">
              
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.075-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982 1-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.887 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.946L.057 24l6.304-1.654a11.882 11.882 0 005.684 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.479-8.413" />
          </svg>
        </a>
        </div>
      </div>
    </div>
  </section>
    </>
  );
}
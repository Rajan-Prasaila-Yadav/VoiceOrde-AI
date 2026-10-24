"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  CheckCircle,
  QrCode,
  AlertCircle,
  RefreshCw,
  Plus,
  Minus,
  Search,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
  Trash2,
  Volume2,
  VolumeX,
  Bot,
  User,
  ClipboardList,
  Printer,
  Share2,
  Tag,
  Check,
  Play,
  Pause,
  X,
} from "lucide-react";
import { ProductItem, OrderRecord } from "@/types";
import { ApiClient } from "@/lib/api-client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  speakText?: string;
  speakLang?: string;
  lastDiscussedProductId?: string;
  model?: string;
  voice?: string;
}

interface GnaniVoiceOption {
  model: "timbre-v3.0" | "timbre-v2.5";
  voice: string;
  name: string;
  gender: "female" | "male";
  badge: string;
  description: string;
}

const GNANI_VOICE_MODELS: GnaniVoiceOption[] = [
  {
    model: "timbre-v3.0",
    voice: "Shivani",
    name: "Shivani",
    gender: "female",
    badge: "v3.0 Modern",
    description: "Crisp conversational tone for kirana store orders",
  },
  {
    model: "timbre-v3.0",
    voice: "Devansh",
    name: "Devansh",
    gender: "male",
    badge: "v3.0 Modern",
    description: "Warm friendly male assistant persona",
  },
  {
    model: "timbre-v3.0",
    voice: "Lakshmi",
    name: "Lakshmi",
    gender: "female",
    badge: "v3.0 Indic",
    description: "Traditional Indic pronunciation & rhythm",
  },
  {
    model: "timbre-v2.5",
    voice: "Nalini",
    name: "Nalini",
    gender: "female",
    badge: "v2.5 Standard",
    description: "Benchmark clear voice for telephony & bills",
  },
  {
    model: "timbre-v2.5",
    voice: "Deepak",
    name: "Deepak",
    gender: "male",
    badge: "v2.5 Standard",
    description: "Authoritative classic male shopkeeper voice",
  },
  {
    model: "timbre-v2.5",
    voice: "Radhika",
    name: "Radhika",
    gender: "female",
    badge: "v2.5 Standard",
    description: "Melodic Hindi voice for order readbacks",
  },
];

const SAMPLE_INTERACTIONS = [
  {
    label: "🏪 दुकान में क्या सामान उपलब्ध है?",
    text: "What are the items available in the store?",
  },
  {
    label: "❓ आटा का भाव क्या है?",
    text: "Bhaiya, Aashirvaad aata ka price aur availability kya hai?",
  },
  {
    label: "➕ 1 kg add kar do",
    text: "Haan, 1 kg add kar do cart mein",
  },
  {
    label: "🛒 1L mustard oil aur namak",
    text: "1 litre Fortune mustard oil aur ek packet Tata salt chahiye",
  },
  {
    label: "🏷️ क्या कोई डिस्काउंट मिलेगा?",
    text: "Bhaiya, is order par koi discount ya offer milega kya?",
  },
  {
    label: "✅ बस इतना ही, आर्डर कन्फर्म करो",
    text: "Bas itna hi chahiye, order confirm kar do",
  },
];

export function VoiceOrderDesk() {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("hi-IN");
  const [selectedGnaniModel, setSelectedGnaniModel] = useState<"timbre-v3.0" | "timbre-v2.5">("timbre-v3.0");
  const [selectedGnaniVoice, setSelectedGnaniVoice] = useState("Shivani");
  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);

  const [customerName, setCustomerName] = useState("Sunita Devi");
  const [customerPhone, setCustomerPhone] = useState("9812345678");
  const [deliveryAddress, setDeliveryAddress] = useState(
    "Flat 204, Radha Krishna Apts, Main Bazaar"
  );
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI_QR" | "CREDIT_UDHAAR">(
    "UPI_QR"
  );
  const [placedOrder, setPlacedOrder] = useState<OrderRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shopSettings, setShopSettings] = useState<any>(null);

  // Multi-Turn Chat Conversation State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-0",
      role: "assistant",
      content:
        "Namaste! Yadav Kirana & General Store mein aapka swagat hai. Main aapka Kirana AI sahayak hoon. Aapko aaj kya chahiye — Atta, Chawal, Tel, Masale ya koi aur grocery? Bolkar batayein!",
      time: "Just now",
      speakText:
        "Namaste! Yadav Kirana & General Store mein aapka swagat hai. Aapko aaj kya chahiye? Bolkar batayein!",
      speakLang: "hi-IN",
    },
  ]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGnaniVoice, setIsGnaniVoice] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [auditioningVoiceKey, setAuditioningVoiceKey] = useState<string | null>(null);
  const [activeSpeakingModel, setActiveSpeakingModel] = useState<string>("timbre-v3.0");
  const [activeSpeakingVoice, setActiveSpeakingVoice] = useState<string>("Shivani");
  const [autoplayBlockedAudio, setAutoplayBlockedAudio] = useState<{
    audioUrl: string;
    text: string;
    model: string;
    voice: string;
  } | null>(null);
  const [loadingAudioForMsgId, setLoadingAudioForMsgId] = useState<string | null>(null);
  const [readyToConfirm, setReadyToConfirm] = useState(false);

  // Manual Quick Catalogue Search state
  const [showCataloguePicker, setShowCataloguePicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerCategory, setPickerCategory] = useState("all");

  const latestTranscriptRef = useRef("");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const gnaniAudioRef = useRef<HTMLAudioElement | null>(null);

  // Synchronized refs so async audio callbacks always have the freshest user choice
  const selectedModelRef = useRef<"timbre-v3.0" | "timbre-v2.5">(selectedGnaniModel);
  const selectedVoiceRef = useRef<string>(selectedGnaniVoice);

  useEffect(() => {
    selectedModelRef.current = selectedGnaniModel;
  }, [selectedGnaniModel]);

  useEffect(() => {
    selectedVoiceRef.current = selectedGnaniVoice;
  }, [selectedGnaniVoice]);

  // Custom Dropdown State for Gnani Voice Model & Speaker
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
  const voiceDropdownRef = useRef<HTMLDivElement>(null);

  // Save selected model and voice to localStorage so user choice persists across page refreshes
  const handleSelectModel = (model: "timbre-v3.0" | "timbre-v2.5", voice: string) => {
    setSelectedGnaniModel(model);
    setSelectedGnaniVoice(voice);
    selectedModelRef.current = model;
    selectedVoiceRef.current = voice;
    if (typeof window !== "undefined") {
      localStorage.setItem("voiceorder_selected_model", model);
      localStorage.setItem("voiceorder_selected_voice", voice);
    }
  };

  const handleSelectLanguage = (lang: string) => {
    setSelectedLanguage(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("voiceorder_selected_language", lang);
    }
  };

  // Close voice dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (voiceDropdownRef.current && !voiceDropdownRef.current.contains(event.target as Node)) {
        setShowVoiceDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load products to match items
  const loadProducts = async () => {
    try {
      const items = await ApiClient.getProducts();
      setProducts(items);
    } catch (e) {
      console.warn("Could not load products:", e);
    }
  };

  useEffect(() => {
    loadProducts();

    // 1. Restore saved Gnani voice model, speaker, and language from localStorage
    if (typeof window !== "undefined") {
      const savedModel = localStorage.getItem("voiceorder_selected_model") as
        | "timbre-v3.0"
        | "timbre-v2.5"
        | null;
      const savedVoice = localStorage.getItem("voiceorder_selected_voice");
      const savedLang = localStorage.getItem("voiceorder_selected_language");

      if (savedModel === "timbre-v3.0" || savedModel === "timbre-v2.5") {
        setSelectedGnaniModel(savedModel);
        selectedModelRef.current = savedModel;
      }
      if (savedVoice) {
        setSelectedGnaniVoice(savedVoice);
        selectedVoiceRef.current = savedVoice;
      }
      if (savedLang) {
        setSelectedLanguage(savedLang);
      }
    }

    // Load store configuration for bills and QR code
    fetch("/api/shop/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setShopSettings(data);
          const name = data.name || "Yadav Kirana & General Store";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === "msg-0"
                ? {
                    ...m,
                    content: `Namaste! ${name} mein aapka swagat hai. Main aapka Kirana AI sahayak hoon. Aapko aaj kya chahiye — Atta, Chawal, Tel, Masale ya koi aur grocery? Bolkar batayein!`,
                    speakText: `Namaste! ${name} mein aapka swagat hai. Aapko aaj kya chahiye? Bolkar batayein!`,
                  }
                : m
            )
          );
        }
      })
      .catch((e) => console.warn("Shop settings load failed", e));

    // Auto-fill customer profile details if logged in
    const cachedName = localStorage.getItem("voiceorder_customer_name");
    const cachedPhone = localStorage.getItem("voiceorder_customer_phone");
    const cachedAddress = localStorage.getItem("voiceorder_customer_address");
    if (cachedName) setCustomerName(cachedName);
    if (cachedPhone) setCustomerPhone(cachedPhone);
    if (cachedAddress) setDeliveryAddress(cachedAddress);
  }, []);

  // Filter products for quick-add picker
  const pickerCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoryName) set.add(p.categoryName);
    });
    return Array.from(set).sort();
  }, [products]);

  const filteredPickerProducts = useMemo(() => {
    return products.filter((p) => {
      if (pickerCategory !== "all" && p.categoryName !== pickerCategory) return false;
      if (pickerSearch.trim()) {
        const q = pickerSearch.toLowerCase().trim();
        const mName = p.name.toLowerCase().includes(q);
        const mHindi = p.hindiName ? p.hindiName.toLowerCase().includes(q) : false;
        const mBrand = p.brand ? p.brand.toLowerCase().includes(q) : false;
        return mName || mHindi || mBrand;
      }
      return true;
    });
  }, [products, pickerSearch, pickerCategory]);

  const handleAddItemToOrder = (product: ProductItem) => {
    setOrderItems((prev) => {
      const existingIdx = prev.findIndex((it) => it.productId === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + 1;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          totalPrice: newQty * product.sellingPrice,
          stockError: product.availableStock < newQty,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            productName: `${product.brand ? product.brand + " " : ""}${product.name}`.trim(),
            unit: product.unit,
            quantity: 1,
            unitPrice: product.sellingPrice,
            totalPrice: product.sellingPrice,
            availableStock: product.availableStock,
            stockError: product.availableStock < 1,
          },
        ];
      }
    });
  };

  const handleUpdateItemQty = (productId: string, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((it) => {
          if (it.productId === productId) {
            const newQty = it.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...it,
              quantity: newQty,
              totalPrice: newQty * it.unitPrice,
              stockError: it.availableStock < newQty,
            };
          }
          return it;
        })
        .filter(Boolean) as any[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  // Stop TTS immediately (Barge-in / Stop voice)
  const stopSpeaking = () => {
    if (gnaniAudioRef.current) {
      try {
        gnaniAudioRef.current.pause();
        gnaniAudioRef.current.currentTime = 0;
      } catch (e) {}
      gnaniAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsGnaniVoice(false);
    setIsPlayingPreview(false);
    setAuditioningVoiceKey(null);
    setLoadingAudioForMsgId(null);
  };

  // Preview the selected Gnani Voice Model & Speaker directly with audio playback
  const playVoicePreview = async (
    modelToTest?: "timbre-v3.0" | "timbre-v2.5",
    voiceToTest?: string
  ) => {
    const targetModel = modelToTest || selectedGnaniModel;
    const targetVoice = voiceToTest || selectedGnaniVoice;
    const voiceKey = `${targetModel}-${targetVoice}`;

    // If currently auditioning this exact voice, toggle it off (Stop)
    if (auditioningVoiceKey === voiceKey && (isSpeaking || isPlayingPreview)) {
      stopSpeaking();
      return;
    }

    stopSpeaking();
    setIsPlayingPreview(true);
    setAuditioningVoiceKey(voiceKey);
    setError(null);
    setAutoplayBlockedAudio(null);

    // Natural Hinglish audio sample tailored for the selected model and voice
    const sampleText =
      targetVoice === "Devansh" || targetVoice === "Deepak"
        ? `Namaste! Main Gnani Timbre ${targetModel === "timbre-v3.0" ? "v3" : "v2.5"} ${targetVoice} hoon. Aapke kirana store ke order aur hisaab ke liye tayyar hoon!`
        : `Namaste! Main Gnani Timbre ${targetModel === "timbre-v3.0" ? "v3" : "v2.5"} ${targetVoice} hoon. Yadav Kirana Store mein aapka swagat hai. Aapko aaj kya mangwana hai?`;

    try {
      const res = await fetch("/api/gnani/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sampleText,
          language: selectedLanguage || "hi-IN",
          voice: targetVoice,
          model: targetModel,
        }),
      });

      if (!res.ok) throw new Error("Voice synthesis failed for model " + targetModel);
      const data = await res.json();

      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        gnaniAudioRef.current = audio;
        setIsSpeaking(true);
        setIsGnaniVoice(true);
        setActiveSpeakingModel(targetModel);
        setActiveSpeakingVoice(targetVoice);

        audio.onended = () => {
          setIsSpeaking(false);
          setIsGnaniVoice(false);
          setIsPlayingPreview(false);
          setAuditioningVoiceKey(null);
          gnaniAudioRef.current = null;
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          setIsGnaniVoice(false);
          setIsPlayingPreview(false);
          setAuditioningVoiceKey(null);
          gnaniAudioRef.current = null;
        };

        await audio.play();
      }
    } catch (err: any) {
      console.warn("Voice preview error:", err);
      setError(`Voice preview error: ${err.message || "Failed to generate speech"}`);
      setIsPlayingPreview(false);
      setAuditioningVoiceKey(null);
      setIsSpeaking(false);
      setIsGnaniVoice(false);
    }
  };

  // Text-To-Speech: Reads Kirana AI answer aloud cleanly using Gnani Timbre Neural Voice
  const speakResponse = async (
    text: string,
    speakLang?: string,
    forceModel?: "timbre-v3.0" | "timbre-v2.5",
    forceVoice?: string,
    msgId?: string
  ) => {
    stopSpeaking();
    setAutoplayBlockedAudio(null);
    if (msgId) setLoadingAudioForMsgId(msgId);

    const modelToUse = forceModel || selectedModelRef.current || selectedGnaniModel;
    const voiceToUse = forceVoice || selectedVoiceRef.current || selectedGnaniVoice;

    // Clean speech text so TTS never says "dot", "bracket", "bullet", or reads formatting symbols
    const cleanText = text
      .replace(/[*_#`~•]/g, " ")
      .replace(/\([^)]*\)/g, " ") // removes anything in parentheses like (₹105)
      .replace(/₹\s*(\d+)/g, "$1 rupaye ")
      .replace(/₹/g, " rupaye ")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[\\/|]/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\bdot\b/gi, "")
      .replace(/\.+$/g, "") // remove trailing dot
      .trim();

    if (!cleanText) {
      if (msgId) setLoadingAudioForMsgId(null);
      return;
    }

    // 1. Primary: Real Gnani AI Timbre Neural Voice API
    try {
      const res = await fetch("/api/gnani/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanText,
          language: speakLang || selectedLanguage || "hi-IN",
          voice: voiceToUse,
          model: modelToUse,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioUrl) {
          const audio = new Audio(data.audioUrl);
          gnaniAudioRef.current = audio;
          setIsSpeaking(true);
          setIsGnaniVoice(true);
          setActiveSpeakingModel(modelToUse);
          setActiveSpeakingVoice(voiceToUse);

          audio.onended = () => {
            setIsSpeaking(false);
            setIsGnaniVoice(false);
            gnaniAudioRef.current = null;
          };
          audio.onerror = () => {
            setIsSpeaking(false);
            setIsGnaniVoice(false);
            gnaniAudioRef.current = null;
          };

          try {
            await audio.play();
            if (msgId) setLoadingAudioForMsgId(null);
            return;
          } catch (playErr: any) {
            console.warn("[Autoplay Policy]: Browser paused audio without direct click. Showing one-tap player banner.", playErr);
            // Autoplay paused by browser policy - expose one-tap play button so user can immediately hear Gnani audio
            setAutoplayBlockedAudio({
              audioUrl: data.audioUrl,
              text: cleanText,
              model: modelToUse,
              voice: voiceToUse,
            });
            setIsSpeaking(false);
            setIsGnaniVoice(false);
            if (msgId) setLoadingAudioForMsgId(null);
            return;
          }
        }
      }
    } catch (gnaniErr) {
      console.warn("[Gnani Timbre Voice Notice]: Falling back to local synthesizer", gnaniErr);
    } finally {
      if (msgId) setLoadingAudioForMsgId(null);
    }

    // 2. Fallback: Browser SpeechSynthesis only when network/Gnani API fails completely
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Determine proper speech voice language
      const englishLetterCount = (cleanText.match(/[a-zA-Z]/g) || []).length;
      const hindiLetterCount = (cleanText.match(/[\u0900-\u097F]/g) || []).length;
      const isEnglish = englishLetterCount > 20 && hindiLetterCount === 0;

      if (speakLang) {
        utterance.lang = speakLang;
      } else if (isEnglish) {
        utterance.lang = "en-IN";
      } else {
        utterance.lang = selectedLanguage || "hi-IN";
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsGnaniVoice(false);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsGnaniVoice(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsGnaniVoice(false);
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  // Read full order summary aloud to customer using Gnani Timbre (Per Doc 12 & Doc 23 requirement)
  const playOrderSummaryAloud = async () => {
    if (orderItems.length === 0) return;
    const itemsDescription = orderItems
      .map((it) => `${it.quantity} ${it.unit} ${it.productName}`)
      .join(", ");
    const summaryText = `Aapka order hai: ${itemsDescription}. Kul rashi ${grandTotal} rupaye hai. Kya main order confirm kar doon?`;
    const currentModel = selectedModelRef.current || selectedGnaniModel;
    const currentVoice = selectedVoiceRef.current || selectedGnaniVoice;
    await speakResponse(summaryText, selectedLanguage, currentModel, currentVoice);
  };

  // Voice recording toggle with automatic AI voice stop
  const toggleRecording = () => {
    // When user starts speaking, immediately stop any playing AI voice!
    stopSpeaking();

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setTranscript("");
    latestTranscriptRef.current = "";
    setError(null);
    stopSpeaking();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = selectedLanguage;
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let currentText = "";
          for (let i = 0; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          setTranscript(currentText);
          latestTranscriptRef.current = currentText;
        };

        recognition.onend = () => {
          setIsRecording(false);
          const finalSpoken = latestTranscriptRef.current.trim();
          if (finalSpoken) {
            processTranscript(finalSpoken);
          }
        };

        recognition.onerror = (event: any) => {
          setIsRecording(false);
          const errType = event.error || "unknown";
          if (errType === "not-allowed") {
            setError(
              "Microphone permission was denied. Please allow microphone in browser address bar, or use the quick sample queries below."
            );
          } else if (errType === "no-speech") {
            setError("No speech was heard. Please speak close to your microphone or try a sample order.");
          } else if (errType === "network") {
            setError("Speech network connection issue. You can type or use the sample queries below.");
          } else {
            console.warn("Speech recognition notice:", errType);
          }
        };

        (window as any)._rec = recognition;
        recognition.start();
        return;
      } catch (err: any) {
        console.warn("SpeechRecognition start failed, fallback to sample", err);
      }
    }

    // Default simulation for browsers without Web Speech API
    setError("Web Speech is not supported on this browser/environment. Loading demo spoken order...");
    setTimeout(() => {
      const demo = "दो किलो आटा, एक पैकेट अमूल बटर और एक किलो चीनी चाहिए";
      setTranscript(demo);
      latestTranscriptRef.current = demo;
      setIsRecording(false);
      processTranscript(demo);
    }, 1500);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if ((window as any)._rec) {
      try {
        (window as any)._rec.stop();
      } catch (e) {}
    }
    if (latestTranscriptRef.current.trim()) {
      processTranscript(latestTranscriptRef.current.trim());
    }
  };

  // Conversational Multi-Turn Engine: Asks questions or places orders using real DB & Gnani Evon LLM
  const processTranscript = async (customText?: string) => {
    const textToProcess = (typeof customText === "string" ? customText : transcript).trim();
    if (!textToProcess) return;

    // Stop previous voice
    stopSpeaking();
    setProcessing(true);
    setError(null);

    // 1. Append user message to conversation immediately
    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: textToProcess,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextConversation = [...messages, userMsg];
    setMessages(nextConversation);
    setTranscript("");

    try {
      const res = await fetch("/api/gnani/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToProcess,
          customerPhone,
          conversationHistory: nextConversation.map((m) => ({
            role: m.role,
            content: m.content,
            lastDiscussedProductId: m.lastDiscussedProductId,
          })),
          currentCart: orderItems,
          currentDiscount: discount,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to process query");

      // 2. Handle Discount if granted by store
      if (typeof json.appliedDiscount === "number") {
        setDiscount(json.appliedDiscount);
      }

      // 3. Handle Ready to Confirm flag
      if (json.readyToConfirm) {
        setReadyToConfirm(true);
      }

      // 4. Append AI response to conversation
      if (json.reply) {
        const currentModel = selectedModelRef.current || selectedGnaniModel;
        const currentVoice = selectedVoiceRef.current || selectedGnaniVoice;

        const aiMsg: ChatMessage = {
          id: "ai-" + Date.now(),
          role: "assistant",
          content: json.reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          speakText: json.speakText || json.reply,
          speakLang: json.speakLang,
          lastDiscussedProductId: json.lastDiscussedProductId,
          model: currentModel,
          voice: currentVoice,
        };

        setMessages((prev) => [...prev, aiMsg]);
        // Speak response aloud to customer using active Gnani model and voice
        speakResponse(json.speakText || json.reply, json.speakLang, currentModel, currentVoice);
      }

      // 5. If items were detected to be added, update cart
      if (json.items && json.items.length > 0) {
        setOrderItems((prev) => {
          const merged = [...prev];
          for (const newItem of json.items) {
            const idx = merged.findIndex((m) => m.productId === newItem.productId);
            if (idx >= 0) {
              const newQty = merged[idx].quantity + newItem.quantity;
              merged[idx] = {
                ...merged[idx],
                quantity: newQty,
                totalPrice: newQty * merged[idx].unitPrice,
                stockError: merged[idx].availableStock < newQty,
              };
            } else {
              merged.push(newItem);
            }
          }
          return merged;
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to process question with Kirana AI");
    } finally {
      setProcessing(false);
    }
  };

  // Confirm order and trigger automatic stock subtraction in backend
  const handleConfirmOrder = async () => {
    if (orderItems.length === 0) return;
    setProcessing(true);
    setError(null);
    stopSpeaking();

    const hasStockError = orderItems.some((it) => it.stockError);
    if (hasStockError) {
      setError("Please fix items that exceed available stock before confirming");
      setProcessing(false);
      return;
    }

    try {
      const sub = orderItems.reduce((acc, it) => acc + it.totalPrice, 0);
      const grandTotal = Math.max(0, sub - discount);

      const payload = {
        shopId: "00000000-0000-0000-0000-000000000001",
        customerName,
        customerPhone,
        deliveryAddress,
        rawTranscript: messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
        detectedLanguage: selectedLanguage,
        isVoiceOrder: true,
        paymentMode,
        subtotal: sub,
        discount,
        totalAmount: grandTotal,
        items: orderItems.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          unit: it.unit,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Order placement failed");

      setPlacedOrder({
        ...json.data,
        subtotal: sub,
        totalAmount: grandTotal,
        items: orderItems,
      });

      // Save customer phone for order tracking
      localStorage.setItem("voiceorder_customer_phone", customerPhone);
      localStorage.setItem("voiceorder_customer_name", customerName);
      localStorage.setItem("voiceorder_customer_address", deliveryAddress);

      // Speak confirmation back
      speakResponse(`Aapka order #${json.data.orderNumber} successfully place ho chuka hai!`);

      // Reload products to see immediately updated (subtracted) stock!
      loadProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const subtotal = orderItems.reduce((acc, it) => acc + it.totalPrice, 0);
  const grandTotal = Math.max(0, subtotal - discount);

  return (
    <div className="space-y-8">
      {/* Voice Recorder & Conversational AI Desk */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xl relative overflow-hidden space-y-6">
        {/* Top Header */}
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gnani AI Conversational Voice Desk • Real Store Dialogue</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Natural Spoken Kirana Conversation (स्वाभाविक बोलचाल)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Ask item rates, choose pack sizes, request discounts, or confirm orders just like talking to a real neighbourhood shopkeeper.
          </p>

          {/* Dual Voice Controls: Spoken Language & Gnani AI Voice Model */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {/* Spoken Language Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Input Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => handleSelectLanguage(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium shadow-xs [&>option]:bg-slate-900 [&>option]:text-white"
              >
                <option value="hi-IN">Hindi (हिन्दी / Hinglish)</option>
                <option value="en-IN">Indian English</option>
                <option value="mr-IN">Marathi (मराठी)</option>
                <option value="ta-IN">Tamil (தமிழ்)</option>
                <option value="te-IN">Telugu (తెలుగు)</option>
                <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
                <option value="gu-IN">Gujarati (ગુજરાતી)</option>
                <option value="bn-IN">Bengali (বাংলা)</option>
              </select>
            </div>

            {/* Direct Model & Voice Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Gnani Voice Model:</span>
              <select
                id="gnani-voice-model-selector"
                value={`${selectedGnaniModel}|${selectedGnaniVoice}`}
                onChange={(e) => {
                  const [m, v] = e.target.value.split("|");
                  handleSelectModel(m as any, v);
                }}
                className="px-3 py-1.5 text-xs rounded-xl border border-emerald-500/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs [&>option]:bg-slate-900 [&>option]:text-white"
              >
                {GNANI_VOICE_MODELS.map((item) => (
                  <option key={`${item.model}-${item.voice}`} value={`${item.model}|${item.voice}`}>
                    {item.model} • {item.name} ({item.gender === "female" ? "Female" : "Male"} - {item.badge})
                  </option>
                ))}
              </select>
            </div>

            {/* Direct Listen / Stop Voice Button */}
            <button
              type="button"
              onClick={() => {
                if (isSpeaking || isPlayingPreview) {
                  stopSpeaking();
                } else {
                  playVoicePreview();
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95 ${
                isSpeaking || isPlayingPreview
                  ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-500 animate-pulse shadow-rose-600/30 ring-2 ring-rose-400/40"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-600/30"
              }`}
              title={
                isSpeaking || isPlayingPreview
                  ? "Stop currently playing voice"
                  : "Listen to sample of selected Gnani model"
              }
            >
              {isSpeaking || isPlayingPreview ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Stop Voice (रोकें)</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white text-white" />
                  <span>Listen Voice (आवाज़ सुनें)</span>
                </>
              )}
            </button>

            {/* Voice Studio Popover Drawer for Deep Model Comparison */}
            <div className="relative inline-block" ref={voiceDropdownRef}>
              <button
                type="button"
                onClick={() => setShowVoiceDropdown((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs transition-all cursor-pointer shadow-xs ${
                  showVoiceDropdown
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-700"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                title="Compare all 6 Gnani models and voices in Studio"
              >
                <span>🎛️ Voice Studio</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showVoiceDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Popover Floating Audition & Selection Studio */}
              {showVoiceDropdown && (
                <div className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 mt-2 w-80 sm:w-96 rounded-3xl bg-slate-900/98 border border-slate-700/80 shadow-2xl p-3 sm:p-4 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl ring-1 ring-black/60">
                  {/* Studio Header */}
                  <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                          Gnani Voice Studio
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/30">
                          Audition & Select
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Click any card to select it, or tap Listen to compare voices.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowVoiceDropdown(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                      title="Close voice studio"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* List of Models with Play/Stop and Card Selection */}
                  <div className="py-2 space-y-2 max-h-80 overflow-y-auto pr-1">
                    {GNANI_VOICE_MODELS.map((item) => {
                      const isSelected =
                        selectedGnaniModel === item.model && selectedGnaniVoice === item.voice;
                      const isAuditioningThis =
                        auditioningVoiceKey === `${item.model}-${item.voice}` &&
                        (isSpeaking || isPlayingPreview);

                      return (
                        <div
                          key={`${item.model}-${item.voice}`}
                          onClick={() => handleSelectModel(item.model, item.voice)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/40"
                              : "bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/70"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-white">
                                  {item.name}
                                </span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                                    item.model === "timbre-v3.0"
                                      ? "bg-purple-950 text-purple-300 border border-purple-500/30"
                                      : "bg-blue-950 text-blue-300 border border-blue-500/30"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                                <span className="text-[10px] text-slate-400 capitalize">
                                  ({item.gender})
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-tight mt-1">
                                {item.description}
                              </p>
                            </div>

                            {isSelected ? (
                              <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center gap-1 shadow-xs">
                                <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="shrink-0 text-[10px] font-semibold text-slate-500 hover:text-slate-300">
                                Click to pick
                              </span>
                            )}
                          </div>

                          {/* Action Row: Listen (Play/Stop) + Choose Model */}
                          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                            {/* Audition Play / Stop Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                playVoicePreview(item.model, item.voice);
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs ${
                                isAuditioningThis
                                  ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-rose-600/30 ring-2 ring-rose-400/40"
                                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                              }`}
                              title={isAuditioningThis ? "Stop this sample" : "Listen to sample"}
                            >
                              {isAuditioningThis ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5" />
                                  <span>Stop Voice</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                                  <span>Listen Sample</span>
                                </>
                              )}
                            </button>

                            {/* Choose Model Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectModel(item.model, item.voice);
                              }}
                              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs ${
                                isSelected
                                  ? "bg-emerald-500 text-slate-950 font-black cursor-default"
                                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 active:scale-95"
                              }`}
                              title={isSelected ? "Currently active model" : "Set this as active voice model"}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Selected</span>
                                </>
                              ) : (
                                <span>Choose Model</span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Popover Footer */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-[11px]">
                      Current: <b className="text-white">{selectedGnaniModel}</b> ({selectedGnaniVoice})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowVoiceDropdown(false)}
                      className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] cursor-pointer"
                    >
                      Done (पूर्ण)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Voice Audio Visualizer Banner (Shown whenever audio is actively playing) */}
          {(isSpeaking || isPlayingPreview) && (
            <div className="w-full max-w-xl mx-auto bg-slate-900/95 dark:bg-slate-950/95 border border-emerald-500/50 rounded-2xl p-3 shadow-xl backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3">
                {/* Audio Equalizer wave bars */}
                <div className="flex items-end gap-1 h-5 px-1">
                  <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-3" />
                  <span className="w-1 bg-teal-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-5" />
                  <span className="w-1 bg-emerald-300 rounded-full animate-[pulse_0.3s_ease-in-out_infinite] h-2" />
                  <span className="w-1 bg-teal-300 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-4" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {isGnaniVoice ? "Gnani Timbre Active" : "Local Synthesizer"}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {activeSpeakingModel} • {activeSpeakingVoice}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Vachana Neural TTS • 24,000 Hz Linear PCM CD-Quality
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={stopSpeaking}
                className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Stop</span>
              </button>
            </div>
          )}

          {/* Autoplay Fallback Tap Unblocker Banner (Shown when browser autoplay pauses audio) */}
          {autoplayBlockedAudio && (
            <div className="w-full max-w-xl mx-auto bg-amber-500/15 border border-amber-500/50 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
              <div className="flex items-center gap-2 text-left">
                <Volume2 className="w-4 h-4 text-amber-500 animate-bounce shrink-0" />
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                  AI Voice generated in {autoplayBlockedAudio.model} ({autoplayBlockedAudio.voice}). Tap to listen:
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const audio = new Audio(autoplayBlockedAudio.audioUrl);
                  gnaniAudioRef.current = audio;
                  setIsSpeaking(true);
                  setIsGnaniVoice(true);
                  setActiveSpeakingModel(autoplayBlockedAudio.model);
                  setActiveSpeakingVoice(autoplayBlockedAudio.voice);
                  audio.onended = () => {
                    setIsSpeaking(false);
                    setIsGnaniVoice(false);
                    gnaniAudioRef.current = null;
                  };
                  audio.play();
                  setAutoplayBlockedAudio(null);
                }}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>Play Voice</span>
              </button>
            </div>
          )}
        </div>

        {/* FULL MULTI-TURN CHAT CONVERSATION THREAD */}
        <div className="bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 max-h-80 sm:max-h-96 overflow-y-auto space-y-4 shadow-inner">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex items-start gap-2.5 sm:gap-3 ${
                  isUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 text-white shadow-xs ${
                    isUser
                      ? "bg-emerald-600"
                      : "bg-gradient-to-tr from-teal-600 to-emerald-500"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 sm:p-4 text-xs sm:text-sm space-y-1.5 shadow-xs ${
                    isUser
                      ? "bg-emerald-600 text-white rounded-tr-none"
                      : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isUser ? "text-emerald-100" : "text-slate-400"
                      }`}
                    >
                      {isUser
                        ? "You (Customer)"
                        : shopSettings?.name
                        ? `${shopSettings.name} AI`
                        : "Kirana AI"}
                    </span>
                    <span
                      className={`text-[10px] ${
                        isUser ? "text-emerald-200" : "text-slate-400"
                      }`}
                    >
                      {m.time}
                    </span>
                  </div>

                  <p className="leading-relaxed font-medium whitespace-pre-line">{m.content}</p>

                  {/* Audio Replay for Assistant Messages with Gnani Model Badge */}
                  {!isUser && (
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/60 mt-1">
                      <div className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Gnani {m.model || selectedGnaniModel} • {m.voice || selectedGnaniVoice}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          speakResponse(
                            m.speakText || m.content,
                            m.speakLang,
                            selectedModelRef.current || selectedGnaniModel,
                            selectedVoiceRef.current || selectedGnaniVoice,
                            m.id
                          )
                        }
                        disabled={loadingAudioForMsgId === m.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800 shadow-2xs"
                        title="Listen to this message with current Gnani voice model"
                      >
                        {loadingAudioForMsgId === m.id ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Generating Gnani Audio...</span>
                          </>
                        ) : isSpeaking && gnaniAudioRef.current ? (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                            <span>Replay ({selectedGnaniModel})</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Listen ({selectedGnaniModel})</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>

        {/* VOICE CONTROL BAR WITH BARGE-IN / STOP VOICE */}
        <div className="py-2 flex flex-col items-center justify-center space-y-3">
          <div className="flex items-center gap-4">
            {/* Big Interactive Mic Button */}
            <button
              onClick={toggleRecording}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                isRecording
                  ? "bg-rose-600 text-white animate-pulse shadow-rose-600/40 ring-8 ring-rose-400/20"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 hover:scale-105"
              }`}
              title="Tap to speak your order or question"
            >
              {isRecording ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
            </button>

            {/* Prominent Stop AI Voice Button (Barge-in control) */}
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold animate-pulse shadow-lg shadow-rose-600/30 cursor-pointer transition-all"
                title="Stop AI voice speaking"
              >
                <VolumeX className="w-4 h-4" />
                <span>Stop Voice (चुप रहें)</span>
              </button>
            )}
          </div>

          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {isRecording
              ? "Listening... Speak your order or question"
              : isSpeaking
              ? isGnaniVoice
                ? `🔊 Gnani AI ${selectedGnaniModel} (${selectedGnaniVoice}) speaking... Tap mic or Stop to interrupt`
                : "AI is speaking... Tap mic or Stop to interrupt"
              : "Tap Mic to Speak (बोलिए - भाव पूछें, साइज बताएं, या आर्डर दें)"}
          </span>
        </div>

        {/* Quick Conversational Prompt Chips */}
        <div className="pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-2">
            Try natural conversational prompts:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {SAMPLE_INTERACTIONS.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => processTranscript(sample.text)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors cursor-pointer"
                title="Click to send as spoken message"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fallback Text Input Box */}
        <div className="space-y-3 pt-2">
          <div className="relative">
            <textarea
              rows={2}
              placeholder="Or type here: e.g. Aashirvaad aata ka price kya hai? or 1 kg add kar do..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  processTranscript();
                }
              }}
              className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => processTranscript()}
              disabled={!transcript.trim() || processing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Kirana AI replying...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Send to Kirana AI</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowCataloguePicker(!showCataloguePicker)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <Package className="w-4 h-4 text-emerald-600" />
              <span>{showCataloguePicker ? "Hide Catalogue" : "Browse & Add Items"}</span>
              {showCataloguePicker ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* QUICK CATALOGUE SEARCH & PICK DRAWER */}
        {showCataloguePicker && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Quick search catalogue items by name or Hindi..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={pickerCategory}
                onChange={(e) => setPickerCategory(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Categories</option>
                {pickerCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
              {filteredPickerProducts.slice(0, 20).map((prod) => (
                <div
                  key={prod.id}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {prod.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      ₹{prod.sellingPrice} / {prod.unit} • Stock: {prod.availableStock}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddItemToOrder(prod)}
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 cursor-pointer shadow-sm"
                    title="Add to order"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Order Cart & Bill Review */}
      {orderItems.length > 0 && !placedOrder && (
        <div
          className={`bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-xl space-y-6 transition-all ${
            readyToConfirm
              ? "border-emerald-500 ring-4 ring-emerald-500/20"
              : "border-slate-200 dark:border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Live Order Cart & Verified Bill (चेक करें)
              </h3>
              <p className="text-xs text-slate-500">
                Live catalogue verification with automatic stock reservation
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">
              {orderItems.length} Items in Cart
            </span>
          </div>

          {/* Mobile Card Layout (< sm screens) */}
          <div className="sm:hidden space-y-3">
            {orderItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {item.productName}
                    </div>
                    <div className="text-xs text-slate-500">
                      ₹{item.unitPrice} / {item.unit}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.productId)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateItemQty(item.productId, -1)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer shadow-xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold px-2">
                      {item.quantity} {item.unit}
                    </span>
                    <button
                      onClick={() => handleUpdateItemQty(item.productId, 1)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      ₹{item.totalPrice}
                    </span>
                  </div>
                </div>

                {item.stockError && (
                  <div className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Only {item.availableStock} in stock!</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table Layout (>= sm screens) */}
          <div className="hidden sm:block border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Product</th>
                  <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-400">
                    Quantity & Size
                  </th>
                  <th className="p-3 text-right font-semibold text-slate-600 dark:text-slate-400">
                    Rate
                  </th>
                  <th className="p-3 text-right font-semibold text-slate-600 dark:text-slate-400">
                    Amount
                  </th>
                  <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-400">
                    Stock
                  </th>
                  <th className="p-3 text-right font-semibold text-slate-600 dark:text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orderItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-medium text-slate-900 dark:text-white">
                      {item.productName}
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-white dark:bg-slate-800">
                        <button
                          onClick={() => handleUpdateItemQty(item.productId, -1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold px-1">
                          {item.quantity} {item.unit}
                        </span>
                        <button
                          onClick={() => handleUpdateItemQty(item.productId, 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-right text-slate-600 dark:text-slate-400">
                      ₹{item.unitPrice}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                      ₹{item.totalPrice}
                    </td>
                    <td className="p-3 text-center">
                      {item.stockError ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                          Only {item.availableStock} Left
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                          In Stock ({item.availableStock})
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Customer info & Delivery */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Mobile Number (10 digits)</label>
              <div className="flex items-center">
                <span className="inline-flex items-center px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-300 dark:border-slate-700 rounded-l-xl select-none">
                  🇮🇳 +91
                </span>
                <input
                  type="text"
                  maxLength={10}
                  value={customerPhone.replace(/^\+91/, "").replace(/\D/g, "")}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setCustomerPhone(`+91${digits}`);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-r-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Payment Method</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="UPI_QR">UPI QR Code</option>
                <option value="CASH">Cash on Delivery</option>
                <option value="CREDIT_UDHAAR">Shop Credit (Udhaar)</option>
              </select>
            </div>
          </div>

          {/* Subtotal, Discount, & Grand Total Calculation */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>Subtotal: ₹{subtotal}</span>
                {discount > 0 && (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Discount Applied: -₹{discount}
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                Grand Total: <span className="text-emerald-600">₹{grandTotal}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={playOrderSummaryAloud}
                disabled={isSpeaking || isPlayingPreview}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm border border-slate-300 dark:border-slate-700 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                title="Read whole order items and grand total aloud using Gnani Timbre"
              >
                <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Read Bill Aloud (बोलकर सुनाएं)</span>
              </button>

              <button
                onClick={handleConfirmOrder}
                disabled={processing}
                className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-white font-bold text-sm shadow-xl transition-all cursor-pointer disabled:opacity-50 ${
                  readyToConfirm
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/40 ring-4 ring-emerald-500/30 scale-105"
                    : "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 shadow-slate-900/20"
                }`}
              >
                <span>Confirm Order & Deduct Stock</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmed & Receipt View */}
      {placedOrder && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
              Order #{placedOrder.orderNumber} Confirmed Successfully!
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Items reserved and inventory deducted in real-time.
            </p>
          </div>

          {/* Receipt details */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 max-w-md mx-auto">
            {/* Store Header on Bill */}
            <div className="text-center pb-3 border-b border-slate-100 dark:border-slate-800 space-y-1">
              <span className="font-black text-sm text-slate-900 dark:text-white block">
                {shopSettings?.name || "Sharma Kirana Store"}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {shopSettings?.address || "Shop 12, Main Bazaar"} • Ph: {shopSettings?.phone || "+919876543210"}
              </span>
              {shopSettings?.googleMapsUrl && (
                <a
                  href={shopSettings.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold hover:underline"
                >
                  <span>View Store on Google Maps</span>
                </a>
              )}
            </div>

            <div className="flex justify-between text-xs text-slate-500 border-b pb-2">
              <span>Customer: {placedOrder.customerName}</span>
              <span>{placedOrder.customerPhone}</span>
            </div>

            <div className="space-y-2 text-xs">
              {placedOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {it.quantity} {it.unit} x {it.productName}
                  </span>
                  <span className="font-bold">₹{it.totalPrice}</span>
                </div>
              ))}
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-bold border-t pt-2">
                <span>Special Discount Applied</span>
                <span>-₹{discount}</span>
              </div>
            )}

            <div className="border-t pt-3 flex justify-between font-extrabold text-base">
              <span>Grand Total</span>
              <span className="text-emerald-600">₹{placedOrder.totalAmount}</span>
            </div>

            {/* Shop UPI QR in fixed 1:1 Aspect Ratio */}
            {placedOrder.paymentMode === "UPI_QR" && (
              <div className="pt-3 border-t text-center space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Scan Shop UPI QR to Pay
                </span>
                <div className="w-36 h-36 mx-auto aspect-square rounded-2xl overflow-hidden bg-white p-2 shadow-sm border border-slate-200 dark:border-slate-700">
                  <img
                    src={
                      shopSettings?.qrImageUrl ||
                      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${encodeURIComponent(
                        shopSettings?.upiId || "sharmakirana@upi"
                      )}&pn=SharmaKiranaStore&am=${placedOrder.totalAmount}&cu=INR`
                    }
                    alt="Shop UPI QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[11px] font-mono text-emerald-600 block font-bold">
                  UPI: {shopSettings?.upiId || "sharmakirana@upi"}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/my-orders"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Track Order & Thermal Receipt</span>
            </Link>

            <button
              onClick={() => {
                setPlacedOrder(null);
                setOrderItems([]);
                setDiscount(0);
                setReadyToConfirm(false);
                setMessages([
                  {
                    id: "msg-welcome-new",
                    role: "assistant",
                    content:
                      "Namaste! Naya order lene ke liye taiyaar hoon. Aapko kya chahiye? Bolkar batayein!",
                    time: "Just now",
                    speakText: "Namaste! Naya order lene ke liye taiyaar hoon. Bolkar batayein!",
                  },
                ]);
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 cursor-pointer"
            >
              Take Another Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

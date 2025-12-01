// src/pages/Contact/ContactPage.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { usePageTitle } from "@/hooks/usePageTitle";
import { SEOHead } from "@/components/SEOHead";
import { Mail, Send, ChevronDown, HelpCircle, MessageSquare } from "lucide-react";
import { apiJson } from "@/components/shift/apiClient";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "How does PenguinShift transfer playlists between platforms?",
    answer: "PenguinShift uses advanced matching algorithms to find your songs across different music platforms. When you initiate a transfer, we search for each track on the destination platform and create a new playlist with all the matches we find. The process is automated and typically takes just a few minutes."
  },
  {
    question: "Which music platforms are supported?",
    answer: "Currently, PenguinShift supports transferring playlists between Spotify and YouTube Music. We're constantly working on adding more platforms. Stay tuned for updates!"
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely! We take your privacy seriously. PenguinShift only accesses the playlists you explicitly choose to transfer. We don't store your music files, and all authentication is handled securely through OAuth. Your data is encrypted and never shared with third parties."
  },
  {
    question: "What happens if a song isn't found on the destination platform?",
    answer: "If a song can't be matched on the destination platform, it will be listed in the 'Unmatched Tracks' section after your transfer completes. You can review these tracks and manually add them if needed. Our matching algorithm is continuously improving to maximize the number of successful matches."
  },
  {
    question: "Can I transfer playlists if I'm not a premium subscriber?",
    answer: "Yes! PenguinShift works with both free and premium accounts on supported platforms. However, some features may vary depending on your subscription level. For example, Spotify free users may have some limitations on playlist creation."
  },
  {
    question: "How long does a transfer take?",
    answer: "Transfer time depends on the size of your playlist. Small playlists (under 50 songs) typically complete in 1-2 minutes, while larger playlists (100+ songs) may take 5-10 minutes. You'll see real-time progress during the transfer process."
  },
  {
    question: "Can I make my playlists public and share them?",
    answer: "Yes! When creating a transfer, you can choose to make your playlist public. Public playlists appear in our Explore section where other users can discover and use them. You can toggle the visibility of your playlists anytime from your profile."
  },
  {
    question: "What if I encounter an error during transfer?",
    answer: "If you encounter any issues, please check your internet connection and ensure you're properly authenticated with both platforms. If problems persist, contact us through this form and we'll help you resolve the issue. Most errors are temporary and can be resolved by retrying the transfer."
  },
  {
    question: "Do I need to keep PenguinShift open during the transfer?",
    answer: "No, you don't need to keep the page open. Once you initiate a transfer, it continues processing in the background. You'll receive a notification when it's complete, and you can check the status in your transfer history at any time."
  },
  {
    question: "Can I transfer the same playlist multiple times?",
    answer: "Yes! You can transfer playlists as many times as you'd like. This is useful if you want to update a playlist on the destination platform or if you've added new songs to the source playlist."
  }
];

export default function ContactPage() {
  usePageTitle('Contact Us');
  const { showToast, Toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);
  const [expandedFAQs, setExpandedFAQs] = useState<Set<number>>(new Set());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      showToast("Please fill in all fields", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiJson('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message
        })
      });

      showToast("Message sent successfully! We'll get back to you soon.", "success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      console.error("Failed to send contact form:", error);
      showToast(
        error.message || "Failed to send message. Please try again later.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <>
      <SEOHead
        title="Contact Us - PenguinShift"
        description="Get in touch with PenguinShift support. Have questions? We're here to help with your playlist transfer needs."
        url={typeof window !== "undefined" ? window.location.href : ""}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 md:mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent mb-4">
            Contact Us
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Have a question? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
            </div>
            
            <div className="space-y-3">
              {faqData.map((faq, index) => {
                const isExpanded = expandedFAQs.has(index);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset"
                    >
                      <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-4 pt-2 text-gray-600 leading-relaxed">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Contact Form Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Send us a Message</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-medium">
                  Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your name"
                  required
                  className="w-full"
                  enableModeration={false}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  required
                  className="w-full"
                  enableModeration={false}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-gray-700 font-medium">
                  Subject *
                </Label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="What is this regarding?"
                  required
                  className="w-full"
                  enableModeration={false}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-gray-700 font-medium">
                  Message *
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us how we can help..."
                  required
                  rows={6}
                  className="w-full resize-none"
                  enableModeration={false}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600 text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-5 h-5 text-purple-600" />
                <span className="text-sm">
                  Or email us directly at{" "}
                  <a
                    href="mailto:penguinshift42@gmail.com"
                    className="text-purple-600 hover:text-purple-700 font-medium underline"
                  >
                    penguinshift42@gmail.com
                  </a>
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      {Toast}
    </div>
    </>
  );
}

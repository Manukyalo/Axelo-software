import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  ShieldCheck,
  Zap,
  Coffee
} from 'lucide-react';
import { Button } from '../ui/Button';

export const DailyBriefingCard = ({ alert, onResolve }) => {
  if (!alert) return null;

  // Split message into sections if it follows the format
  const lines = alert.message.split('\n');
  const greeting = lines[0];
  const sections = [];
  let currentSection = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.includes(': ')) {
      const [title, content] = line.split(': ');
      sections.push({ title, content, items: [] });
    } else if (line.startsWith('• ')) {
      if (sections.length > 0) {
        sections[sections.length - 1].items.push(line.substring(2));
      }
    }
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-safari-primary to-safari-primary/90 dark:from-dark-card dark:to-dark-surface rounded-3xl p-8 text-white shadow-2xl mb-8 border border-white/10 group">
      {/* Decorative Sparkles */}
      <div className="absolute top-4 right-4 text-safari-gold opacity-30 animate-pulse">
        <Sparkles size={120} />
      </div>
      <div className="absolute -bottom-10 -left-10 text-white opacity-5">
        <Coffee size={200} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-safari-gold/20 flex items-center justify-center text-safari-gold">
            <Zap size={22} className="fill-current" />
          </div>
          <div>
            <h2 className="text-2xl font-playfair font-bold">Daily Intelligence Briefing</h2>
            <p className="text-[10px] text-safari-gold font-bold uppercase tracking-[0.2em]">{alert.createdAt?.toDate ? alert.createdAt.toDate().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}</p>
          </div>
        </div>

        <p className="text-lg font-playfair italic text-white/90 mb-8 border-l-4 border-safari-gold pl-4">
          "{greeting}"
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-safari-gold flex items-center gap-2">
                {section.title === 'TODAY\'S SAFARIS' && <Calendar size={14} />}
                {section.title === 'FLEET STATUS' && <ShieldCheck size={14} />}
                {section.title === 'PENNDING ATTENTION' && <Zap size={14} />}
                {section.title}
              </h4>
              <p className="text-sm font-bold text-white/90">{section.content}</p>
              {section.items.length > 0 && (
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/70 leading-relaxed group/item hover:text-white transition-colors">
                      <span className="w-1 h-1 rounded-full bg-safari-gold mt-1.5 shrink-0 group-hover/item:scale-150 transition-transform" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 gap-4">
          <div className="flex items-center gap-4 text-xs text-white/50">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-safari-success" /> System Protected
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp size={14} className="text-safari-gold" /> Optimized for Revenue
            </div>
          </div>
          <Button 
            onClick={() => onResolve(alert.id)}
            className="w-full md:w-auto bg-safari-gold hover:bg-safari-gold/90 text-safari-primary font-bold px-8 rounded-xl shadow-lg hover:translate-y-[-2px] transition-all"
          >
            Acknowledge & Complete Briefing
          </Button>
        </div>
      </div>
    </div>
  );
};

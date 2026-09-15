import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { RatingStars } from '../../components/ecommerce/RatingStars';
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ShieldAlert,
  User,
} from 'lucide-react';

interface FlaggedReview {
  id: string;
  author: string;
  productName: string;
  rating: number;
  comment: string;
  flagReason: string;
  date: string;
}

export const ReviewModerationPage: React.FC = () => {
  const [flaggedReviews, setFlaggedReviews] = useState<FlaggedReview[]>([
    {
      id: 'rev_flag_1',
      author: 'UnknownUser99',
      productName: 'Aura Wireless ANC Headphones',
      rating: 1,
      comment: 'DO NOT BUY SCAM SITE CLICK THIS LINK: http://fake-promo.xyz FOR FREE IPHONE',
      flagReason: 'Spam / Phishing Link Detected',
      date: '2026-10-24',
    },
    {
      id: 'rev_flag_2',
      author: 'CompetitorBrand_Rep',
      productName: 'Ergonomic Titanium Stand',
      rating: 1,
      comment: 'This product breaks instantly, buy from our competitor brand XYZ instead!',
      flagReason: 'Competitor Defamation / Unverified Purchase',
      date: '2026-10-23',
    },
  ]);

  const handleDismiss = (id: string) => {
    setFlaggedReviews(flaggedReviews.filter((r) => r.id !== id));
  };

  const handleDeleteReview = (id: string) => {
    setFlaggedReviews(flaggedReviews.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Review Moderation & Spam Shield
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Automated AI & user-flagged review queue to protect catalog integrity from spam and hate speech.
        </p>
      </div>

      {/* List */}
      <div className="space-y-4">
        {flaggedReviews.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">Zero Flagged Content!</h3>
            <p className="text-xs text-slate-500 mt-1">All customer reviews meet platform safety guidelines.</p>
          </div>
        ) : (
          flaggedReviews.map((r) => (
            <div
              key={r.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Badge variant="danger" size="sm" className="gap-1">
                    <ShieldAlert className="w-3 h-3" /> {r.flagReason}
                  </Badge>
                  <span className="text-xs text-slate-400">Product: <b className="text-white">{r.productName}</b></span>
                </div>

                <div className="flex items-center gap-2">
                  <RatingStars rating={r.rating} size="sm" />
                  <span className="text-xs text-slate-300 font-bold">{r.author}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({r.date})</span>
                </div>

                <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800 italic">
                  "{r.comment}"
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(r.id)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Dismiss Flag
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteReview(r.id)}
                  className="gap-1.5 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Purge Review
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

import 'package:flutter/material.dart';
import '../theme.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  const StatusBadge({super.key, required this.status});

  ({Color bg, Color fg}) _colorsFor(String status) {
    switch (status) {
      case 'completed':
      case 'succeeded':
        return (bg: AppColors.successBg, fg: AppColors.success);
      case 'failed':
        return (bg: AppColors.dangerBg, fg: AppColors.danger);
      case 'needs_approval':
        return (bg: AppColors.accentSoft, fg: const Color(0xFF8A5216));
      default:
        return (bg: AppColors.pendingBg, fg: AppColors.pending);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = _colorsFor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: colors.bg, borderRadius: BorderRadius.circular(100)),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(color: colors.fg, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }
}

import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  Bookmark02Icon,
  Home05Icon,
  ClipboardListIcon,
  ShoppingBasket01Icon,
  UserCircleIcon,
  AlertCircleIcon,
  Analytics01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowReloadHorizontalIcon,
  ArrowRight01Icon,
  ArrowTurnBackwardIcon,
  ArrowUp01Icon,
  BookmarkAdd02Icon,
  Calendar03Icon,
  Call02Icon,
  Camera01Icon,
  CameraOff01Icon,
  Cancel01Icon,
  CancelCircleIcon,
  ChartDownIcon,
  ChartUpIcon,
  CheckmarkCircle02Icon,
  ChefHatIcon,
  CircleIcon,
  Clock01Icon,
  Clock04Icon,
  Compass01Icon,
  ComputerIcon,
  Copy01Icon,
  CursorMagicSelection01Icon,
  DashboardSquare01Icon,
  Delete02Icon,
  DeliveryTruck01Icon,
  Download01Icon,
  Edit02Icon,
  FavouriteIcon,
  FilterHorizontalIcon,
  FloppyDiskIcon,
  GiftIcon,
  GridViewIcon,
  HelpCircleIcon,
  Home01Icon,
  ImageAdd01Icon,
  InboxIcon,
  Invoice01Icon,
  KeyboardIcon,
  LinkSquare01Icon,
  ListViewIcon,
  Loading03Icon,
  Location01Icon,
  LockIcon,
  Logout01Icon,
  Mail01Icon,
  Megaphone01Icon,
  Menu01Icon,
  Message01Icon,
  Message02Icon,
  MinusSignIcon,
  Moon02Icon,
  MoreHorizontalIcon,
  Notification01Icon,
  Notification02Icon,
  NotificationOff01Icon,
  PackageDeliveredIcon,
  PackageRemoveIcon,
  PlusSignIcon,
  PlusSignSquareIcon,
  PowerServiceIcon,
  PrinterIcon,
  QrCodeIcon,
  QrCodeScanIcon,
  RefreshIcon,
  Restaurant01Icon,
  Restaurant02Icon,
  RupeeCircleIcon,
  RupeeIcon,
  Scooter01Icon,
  Search01Icon,
  SentIcon,
  Settings01Icon,
  Settings02Icon,
  Share01Icon,
  Share08Icon,
  ShieldKeyIcon,
  ShoppingBag01Icon,
  ShoppingCart01Icon,
  SparklesIcon,
  StarIcon,
  Store01Icon,
  Sun02Icon,
  Tag01Icon,
  Tick02Icon,
  Ticket01Icon,
  TicketStarIcon,
  User02Icon,
  UserCheck01Icon,
  UserGroupIcon,
  UserRemove01Icon,
  UserSettings01Icon,
  ViewIcon,
  ViewOffIcon,
  VolumeHighIcon,
  VolumeOffIcon,
  Wallet01Icon,
  WifiDisconnected01Icon,
} from "@hugeicons/core-free-icons"

/**
 * The project's icon set.
 *
 * Every icon in FoodieHub comes from HugeIcons, drawn on one grid with one
 * stroke weight. Mixing two icon families is the kind of thing nobody can
 * name when they look at a screen but everybody feels — the weights disagree,
 * the corners disagree, and the interface reads as assembled rather than
 * designed.
 *
 * The exports keep their familiar names and the `className`-driven sizing the
 * codebase already uses, so a call site only changes where it imports from.
 * Tailwind's `h-4 w-4` still wins over the SVG's own width/height because CSS
 * beats presentation attributes.
 */

export interface IconProps {
  className?: string
  /** Overrides the default weight; HugeIcons draws at 1.5 natively. */
  strokeWidth?: number
  size?: number
  "aria-hidden"?: boolean | "true" | "false"
  "aria-label"?: string
  role?: string
}

/** The shape every icon in the app satisfies. */
export type IconComponent = (props: IconProps) => JSX.Element

function icon(glyph: Parameters<typeof HugeiconsIcon>[0]["icon"], name: string): IconComponent {
  const Component = ({ className, strokeWidth, size, ...rest }: IconProps) => (
    <HugeiconsIcon
      icon={glyph}
      className={className}
      // A touch heavier than the 1.5 default: at 16px the hairline version
      // disappears against a busy card.
      strokeWidth={strokeWidth ?? 1.8}
      size={size}
      {...rest}
    />
  )
  Component.displayName = name
  return Component
}

export const AlertCircle = icon(AlertCircleIcon, "AlertCircle")
export const AlertTriangle = icon(Alert02Icon, "AlertTriangle")
export const ArrowDown = icon(ArrowDown01Icon, "ArrowDown")
export const ArrowLeft = icon(ArrowLeft01Icon, "ArrowLeft")
export const ArrowRight = icon(ArrowRight01Icon, "ArrowRight")
export const ArrowUp = icon(ArrowUp01Icon, "ArrowUp")
export const BadgeIndianRupee = icon(RupeeCircleIcon, "BadgeIndianRupee")
export const BarChart3 = icon(Analytics01Icon, "BarChart3")
export const Bell = icon(Notification01Icon, "Bell")
export const Bike = icon(Scooter01Icon, "Bike")
export const BellOff = icon(NotificationOff01Icon, "BellOff")
export const BellRing = icon(Notification02Icon, "BellRing")
export const BookmarkCheck = icon(Bookmark02Icon, "BookmarkCheck")
export const BookmarkPlus = icon(BookmarkAdd02Icon, "BookmarkPlus")
export const CalendarClock = icon(Calendar03Icon, "CalendarClock")
export const Camera = icon(Camera01Icon, "Camera")
export const CameraOff = icon(CameraOff01Icon, "CameraOff")
export const Check = icon(Tick02Icon, "Check")
export const CheckCheck = icon(CheckmarkCircle02Icon, "CheckCheck")
export const CheckCircle2 = icon(CheckmarkCircle02Icon, "CheckCircle2")
export const ChefHat = icon(ChefHatIcon, "ChefHat")
export const ChevronDown = icon(ArrowDown01Icon, "ChevronDown")
export const ChevronLeft = icon(ArrowLeft01Icon, "ChevronLeft")
export const ChevronRight = icon(ArrowRight01Icon, "ChevronRight")
export const ChevronUp = icon(ArrowUp01Icon, "ChevronUp")
export const CircleDashed = icon(CircleIcon, "CircleDashed")
export const Clock = icon(Clock01Icon, "Clock")
export const Compass = icon(Compass01Icon, "Compass")
export const Copy = icon(Copy01Icon, "Copy")
export const Download = icon(Download01Icon, "Download")
export const ExternalLink = icon(LinkSquare01Icon, "ExternalLink")
export const Eye = icon(ViewIcon, "Eye")
export const EyeOff = icon(ViewOffIcon, "EyeOff")
export const Gift = icon(GiftIcon, "Gift")
export const Heart = icon(FavouriteIcon, "Heart")
export const HelpCircle = icon(HelpCircleIcon, "HelpCircle")
export const History = icon(Clock04Icon, "History")
export const Home = icon(Home01Icon, "Home")
export const ImagePlus = icon(ImageAdd01Icon, "ImagePlus")
export const Inbox = icon(InboxIcon, "Inbox")
export const IndianRupee = icon(RupeeIcon, "IndianRupee")
export const Keyboard = icon(KeyboardIcon, "Keyboard")
export const LayoutDashboard = icon(DashboardSquare01Icon, "LayoutDashboard")
export const LayoutGrid = icon(GridViewIcon, "LayoutGrid")
export const List = icon(ListViewIcon, "List")
export const Loader2 = icon(Loading03Icon, "Loader2")
export const Lock = icon(LockIcon, "Lock")
export const LogOut = icon(Logout01Icon, "LogOut")
export const Mail = icon(Mail01Icon, "Mail")
export const MapPin = icon(Location01Icon, "MapPin")
export const Megaphone = icon(Megaphone01Icon, "Megaphone")
export const Menu = icon(Menu01Icon, "Menu")
export const MessageSquare = icon(Message01Icon, "MessageSquare")
export const MessagesSquare = icon(Message02Icon, "MessagesSquare")
export const Minus = icon(MinusSignIcon, "Minus")
export const Monitor = icon(ComputerIcon, "Monitor")
export const Moon = icon(Moon02Icon, "Moon")
export const MoreHorizontal = icon(MoreHorizontalIcon, "MoreHorizontal")
export const MousePointerClick = icon(CursorMagicSelection01Icon, "MousePointerClick")
export const PackageCheck = icon(PackageDeliveredIcon, "PackageCheck")
export const PackageX = icon(PackageRemoveIcon, "PackageX")
export const Pencil = icon(Edit02Icon, "Pencil")
export const Phone = icon(Call02Icon, "Phone")
export const Plus = icon(PlusSignIcon, "Plus")
export const Power = icon(PowerServiceIcon, "Power")
export const Printer = icon(PrinterIcon, "Printer")
export const QrCode = icon(QrCodeIcon, "QrCode")
export const Receipt = icon(Invoice01Icon, "Receipt")
export const RefreshCw = icon(RefreshIcon, "RefreshCw")
export const RotateCcw = icon(ArrowReloadHorizontalIcon, "RotateCcw")
export const Save = icon(FloppyDiskIcon, "Save")
export const ScanLine = icon(QrCodeScanIcon, "ScanLine")
export const Search = icon(Search01Icon, "Search")
export const Send = icon(SentIcon, "Send")
export const Settings = icon(Settings01Icon, "Settings")
export const Settings2 = icon(Settings02Icon, "Settings2")
export const Share = icon(Share01Icon, "Share")
export const Share2 = icon(Share08Icon, "Share2")
export const Shield = icon(ShieldKeyIcon, "Shield")
export const ShoppingBag = icon(ShoppingBag01Icon, "ShoppingBag")
export const ShoppingCart = icon(ShoppingCart01Icon, "ShoppingCart")
export const SlidersHorizontal = icon(FilterHorizontalIcon, "SlidersHorizontal")
export const Sparkles = icon(SparklesIcon, "Sparkles")
export const SquarePlus = icon(PlusSignSquareIcon, "SquarePlus")
export const Star = icon(StarIcon, "Star")
export const Store = icon(Store01Icon, "Store")
export const Sun = icon(Sun02Icon, "Sun")
export const Tags = icon(Tag01Icon, "Tags")
export const Ticket = icon(Ticket01Icon, "Ticket")
export const TicketPercent = icon(TicketStarIcon, "TicketPercent")
export const Trash2 = icon(Delete02Icon, "Trash2")
export const Truck = icon(DeliveryTruck01Icon, "Truck")
export const TrendingDown = icon(ChartDownIcon, "TrendingDown")
export const TrendingUp = icon(ChartUpIcon, "TrendingUp")
export const TriangleAlert = icon(Alert02Icon, "TriangleAlert")
export const Undo2 = icon(ArrowTurnBackwardIcon, "Undo2")
export const User = icon(User02Icon, "User")
export const UserCheck = icon(UserCheck01Icon, "UserCheck")
export const UserCog = icon(UserSettings01Icon, "UserCog")
export const UserX = icon(UserRemove01Icon, "UserX")
export const Users = icon(UserGroupIcon, "Users")
export const Utensils = icon(Restaurant02Icon, "Utensils")
export const UtensilsCrossed = icon(Restaurant01Icon, "UtensilsCrossed")
export const Volume2 = icon(VolumeHighIcon, "Volume2")
export const VolumeX = icon(VolumeOffIcon, "VolumeX")
export const Wallet = icon(Wallet01Icon, "Wallet")
export const WifiOff = icon(WifiDisconnected01Icon, "WifiOff")
export const X = icon(Cancel01Icon, "X")
export const XCircle = icon(CancelCircleIcon, "XCircle")

/**
 * Navigation glyphs, chosen rather than mapped.
 *
 * A tab bar is read at 22px by someone walking, so these are picked for
 * silhouette: shapes that stay distinct from each other when the detail
 * disappears. A clipboard for orders rather than a rupee receipt: at 22px the
 * currency mark was the only thing separating it from the cart, and what a
 * student opens that tab for is the docket — where the order is up to — not
 * the bill. `ShoppingBasket` rather than a trolley because nobody pushes a
 * trolley round a canteen.
 */
export const NavHome = icon(Home05Icon, "NavHome")
export const NavOrders = icon(ClipboardListIcon, "NavOrders")
export const NavCart = icon(ShoppingBasket01Icon, "NavCart")
export const NavSaved = icon(Bookmark02Icon, "NavSaved")
export const NavProfile = icon(UserCircleIcon, "NavProfile")
